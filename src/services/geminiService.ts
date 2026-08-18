import { GoogleGenerativeAI } from '@google/generative-ai';
import { BYOKConfig, Priority, RecurrenceInterval } from '../types';

export async function generateSubtasks(apiKey: string, goal: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `Break down this goal into actionable subtasks formatted as JSON: "${goal}"`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export interface SmartTaskResult {
  title: string;
  description: string;
  dueDate: number | null;
  priority: Priority;
  isRecurring: boolean;
  recurrenceInterval: RecurrenceInterval;
}

export interface GoalBreakdownItem {
  title: string;
  description: string;
  dueDate: number | null;
  priority: Priority;
  isRecurring: boolean;
  recurrenceInterval: RecurrenceInterval;
  subtaskTitles: string[];
}

function sanitizeJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  // Remove markdown code fence if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
  }

  const startObj = cleaned.indexOf('{');
  const endObj = cleaned.lastIndexOf('}');
  const startArr = cleaned.indexOf('[');
  const endArr = cleaned.lastIndexOf(']');

  if (startArr !== -1 && (startObj === -1 || startArr < startObj)) {
    if (endArr > startArr) {
      cleaned = cleaned.substring(startArr, endArr + 1);
    }
  } else if (startObj !== -1 && endObj > startObj) {
    cleaned = cleaned.substring(startObj, endObj + 1);
  }

  // Strip single-line comments
  cleaned = cleaned
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      return idx !== -1 ? line.substring(0, idx).trim() : line;
    })
    .join('\n');

  return cleaned;
}

export const geminiService = {
  /**
   * Fetch all valid Gemini 3.6 models available for the user's API key
   */
  async listAvailableModels(apiKey: string): Promise<Array<{ id: string; name: string }>> {
    const fallbackList = [
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Recommended - Fastest)' },
      { id: 'gemini-3.6-pro', name: 'Gemini 3.6 Pro (Deep Reasoning)' },
      { id: 'gemini-3.6-flash-lite', name: 'Gemini 3.6 Flash Lite (Ultra-Low Latency)' },
      { id: 'gemini-3.6-flash-8b', name: 'Gemini 3.6 Flash 8B (Lightweight)' }
    ];

    if (!apiKey || apiKey.trim().length < 10) return fallbackList;

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
      if (!res.ok) return fallbackList;
      const data = await res.json();
      if (!Array.isArray(data.models)) return fallbackList;

      const models = data.models
        .filter((m: any) => {
          const id = (m.name || '').replace(/^models\//, '').toLowerCase();
          const hasGenContent = Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent');
          // Filter to only Gemini 3.6 generation models
          const isGen36 = id.includes('3.6') || id.includes('3-6');
          return hasGenContent && isGen36;
        })
        .map((m: any) => {
          const id = m.name.replace(/^models\//, '');
          const displayName = m.displayName || id;
          return { id, name: `${displayName} (${id})` };
        });

      return models.length > 0 ? models : fallbackList;
    } catch (e) {
      console.warn('Failed to list models:', e);
      return fallbackList;
    }
  },

  /**
   * Validate a BYOK Gemini API key by querying ModelService.ListModels and testing with Gemini 3.6.
   */
  async validateApiKey(apiKey: string, model: string = 'gemini-3.6-flash'): Promise<{
    valid: boolean;
    resolvedModel?: string;
    availableModels?: Array<{ id: string; name: string }>;
    error?: string;
  }> {
    if (!apiKey || apiKey.trim().length < 15) {
      return { valid: false, error: 'API key is too short or invalid format.' };
    }

    const cleanKey = apiKey.trim();

    // 1. Query Google ModelService.ListModels for Gemini 3.6 models
    let modelsList: Array<{ id: string; name: string }> = await this.listAvailableModels(cleanKey);

    // 2. Select authorized model (default to gemini-3.6-flash)
    const cleanRequested = (model && model.includes('3.6')) ? model : 'gemini-3.6-flash';
    const requestedMatch = modelsList.find((m) => m.id === cleanRequested);
    const chosen = requestedMatch?.id || modelsList[0].id || 'gemini-3.6-flash';

    // 3. Ping test with the chosen Gemini 3.6 model
    try {
      const pingRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${chosen}:generateContent?key=${cleanKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Ping test: Reply with "OK"' }] }]
          })
        }
      );

      if (pingRes.ok) {
        return { valid: true, resolvedModel: chosen, availableModels: modelsList };
      } else {
        const errData = await pingRes.json().catch(() => ({}));
        const msg = errData.error?.message || `HTTP ${pingRes.status}: ${pingRes.statusText}`;
        if (pingRes.status === 400 && msg.toLowerCase().includes('api_key_invalid')) {
          return { valid: false, error: 'Invalid API Key. Please check your key in Google AI Studio.' };
        }
        // If chosen 3.6 variant failed, fallback to gemini-3.6-flash
        if (chosen !== 'gemini-3.6-flash') {
          return { valid: true, resolvedModel: 'gemini-3.6-flash', availableModels: modelsList };
        }
        return { valid: false, error: msg };
      }
    } catch (pingErr: any) {
      return { valid: true, resolvedModel: chosen, availableModels: modelsList };
    }
  },

  /**
   * Parse natural language task into structured TaskItem metadata.
   */
  async parseSmartTask(input: string, config: BYOKConfig): Promise<SmartTaskResult> {
    if (!input.trim()) {
      return {
        title: 'New Task',
        description: '',
        dueDate: Date.now(),
        priority: 'MEDIUM',
        isRecurring: false,
        recurrenceInterval: 'NONE'
      };
    }

    const todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const systemPrompt = `You are an intelligent task parsing AI for Tasker AI. Reference Date: ${todayDate}.
Extract structured task metadata from the natural language input.
Return ONLY a valid JSON object matching this schema:
{
  "title": string (concise actionable title),
  "description": string (notes or context),
  "dueDateOffsetDays": number or null (0 for today, 1 for tomorrow, 7 for next week, etc.),
  "dueTime": string or null ("HH:MM" in 24-hour format e.g. "14:30" or "09:00"),
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "isRecurring": boolean,
  "recurrenceInterval": "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
}`;

    const userPrompt = `Parse task: "${input.trim()}"`;

    if (config.apiKey && config.isValidated) {
      try {
        const rawResponse = await this.executeGeminiCall(userPrompt, systemPrompt, config);
        const parsed = JSON.parse(sanitizeJsonResponse(rawResponse));

        let calculatedDueDate: number | null = null;
        if (parsed.dueDateOffsetDays !== undefined && parsed.dueDateOffsetDays !== null) {
          const d = new Date();
          d.setDate(d.getDate() + Number(parsed.dueDateOffsetDays));
          if (parsed.dueTime && typeof parsed.dueTime === 'string' && parsed.dueTime.includes(':')) {
            const [hours, minutes] = parsed.dueTime.split(':').map(Number);
            d.setHours(isNaN(hours) ? 12 : hours, isNaN(minutes) ? 0 : minutes, 0, 0);
          }
          calculatedDueDate = d.getTime();
        }

        const validPriorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        const priority: Priority = validPriorities.includes(parsed.priority?.toUpperCase())
          ? (parsed.priority.toUpperCase() as Priority)
          : 'MEDIUM';

        const validIntervals: RecurrenceInterval[] = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
        const interval: RecurrenceInterval = validIntervals.includes(parsed.recurrenceInterval?.toUpperCase())
          ? (parsed.recurrenceInterval.toUpperCase() as RecurrenceInterval)
          : 'NONE';

        return {
          title: parsed.title || input.trim(),
          description: parsed.description || '',
          dueDate: calculatedDueDate,
          priority,
          isRecurring: Boolean(parsed.isRecurring),
          recurrenceInterval: interval
        };
      } catch (err) {
        console.error('Gemini smart task parse failed, using heuristic fallback:', err);
      }
    }

    // Heuristic Fallback parser for Demo mode or network fallback
    return this.heuristicSmartParse(input);
  },

  /**
   * Break down an overarching goal into 3-5 structured subtasks with milestone checklists.
   */
  async generateGoalBreakdown(goalPrompt: string, config: BYOKConfig): Promise<GoalBreakdownItem[]> {
    if (!goalPrompt.trim()) return [];

    const todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const systemPrompt = `You are a Principal Productivity Architect in Tasker AI. Reference Date: ${todayDate}.
Break down the user's high-level goal into 3 to 5 realistic, sequential, actionable milestone tasks.
Return ONLY a valid JSON array of objects with this schema:
[
  {
    "title": string (actionable milestone title),
    "description": string (why this step matters and how to accomplish it),
    "dueDateOffsetDays": number (day offset from today e.g. 1, 3, 5, 7),
    "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    "isRecurring": boolean,
    "recurrenceInterval": "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
    "subtasks": string[] (2-4 concrete micro-steps for this milestone)
  }
]`;

    const userPrompt = `Goal to breakdown: "${goalPrompt.trim()}"`;

    if (config.apiKey && config.isValidated) {
      try {
        const rawResponse = await this.executeGeminiCall(userPrompt, systemPrompt, config);
        const jsonArray = JSON.parse(sanitizeJsonResponse(rawResponse));

        if (Array.isArray(jsonArray) && jsonArray.length > 0) {
          const now = Date.now();
          const dayMs = 24 * 60 * 60 * 1000;

          return jsonArray.map((item, idx) => {
            const offset = typeof item.dueDateOffsetDays === 'number' ? item.dueDateOffsetDays : idx + 1;
            const validPriorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
            const priority: Priority = validPriorities.includes(item.priority?.toUpperCase())
              ? (item.priority.toUpperCase() as Priority)
              : idx === 0
              ? 'HIGH'
              : 'MEDIUM';

            return {
              title: item.title || `Milestone ${idx + 1}`,
              description: item.description || '',
              dueDate: now + offset * dayMs,
              priority,
              isRecurring: Boolean(item.isRecurring),
              recurrenceInterval: item.recurrenceInterval || 'NONE',
              subtaskTitles: Array.isArray(item.subtasks) ? item.subtasks : []
            };
          });
        }
      } catch (err) {
        console.error('Gemini goal breakdown call failed, falling back to smart heuristic:', err);
      }
    }

    // Heuristic Fallback Generator for Demo Tier
    return this.heuristicGoalBreakdown(goalPrompt);
  },

  /**
   * Internal executor for Gemini REST API with automatic model fallback
   */
  async executeGeminiCall(prompt: string, systemPrompt: string, config: BYOKConfig): Promise<string> {
    const cleanPrimary = (config.model && config.model.includes('3.6')) ? config.model : 'gemini-3.6-flash';
    const apiKey = config.apiKey.trim();

    const candidateModels = [
      cleanPrimary,
      'gemini-3.6-flash',
      'gemini-3.6-pro',
      'gemini-3.6-flash-lite',
      'gemini-3.6-flash-8b'
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    let lastError = '';

    for (const modelToTry of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
              }
            ]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return text;
          }
        } else {
          const errJson = await res.json().catch(() => ({}));
          lastError = errJson.error?.message || `Gemini API returned status ${res.status}`;
        }
      } catch (err: any) {
        lastError = err.message || 'Network error';
      }
    }

    throw new Error(lastError || 'Failed to generate content from Google Gemini');
  },

  /**
   * Smart client-side heuristic NLP fallback
   */
  heuristicSmartParse(input: string): SmartTaskResult {
    const lower = input.toLowerCase();
    let priority: Priority = 'MEDIUM';
    if (lower.includes('urgent') || lower.includes('asap') || lower.includes('emergency')) {
      priority = 'URGENT';
    } else if (lower.includes('important') || lower.includes('priority') || lower.includes('high')) {
      priority = 'HIGH';
    } else if (lower.includes('low') || lower.includes('someday') || lower.includes('whenever')) {
      priority = 'LOW';
    }

    let isRecurring = false;
    let recurrenceInterval: RecurrenceInterval = 'NONE';
    if (lower.includes('every day') || lower.includes('daily')) {
      isRecurring = true;
      recurrenceInterval = 'DAILY';
    } else if (lower.includes('every week') || lower.includes('weekly') || lower.includes('every mon')) {
      isRecurring = true;
      recurrenceInterval = 'WEEKLY';
    } else if (lower.includes('every month') || lower.includes('monthly')) {
      isRecurring = true;
      recurrenceInterval = 'MONTHLY';
    }

    const d = new Date();
    let calculatedDueDate: number | null = null;
    if (lower.includes('today')) {
      d.setHours(18, 0, 0, 0);
      calculatedDueDate = d.getTime();
    } else if (lower.includes('tomorrow')) {
      d.setDate(d.getDate() + 1);
      d.setHours(12, 0, 0, 0);
      calculatedDueDate = d.getTime();
    } else if (lower.includes('next week')) {
      d.setDate(d.getDate() + 7);
      calculatedDueDate = d.getTime();
    } else {
      // Default to 1 day offset
      d.setDate(d.getDate() + 1);
      calculatedDueDate = d.getTime();
    }

    // Clean title
    let title = input.replace(/(every day|daily|weekly|every week|tomorrow|today|urgent|asap)/gi, '').trim();
    if (!title) title = input.trim();

    return {
      title,
      description: 'Smart Added task (Heuristic engine)',
      dueDate: calculatedDueDate,
      priority,
      isRecurring,
      recurrenceInterval
    };
  },

  /**
   * Smart client-side goal breakdown heuristic fallback
   */
  heuristicGoalBreakdown(goalPrompt: string): GoalBreakdownItem[] {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const cleanGoal = goalPrompt.trim();

    return [
      {
        title: `Phase 1: Research & Scope "${cleanGoal.slice(0, 35)}..."`,
        description: 'Define clear milestones, core requirements, and necessary resources.',
        dueDate: now + 1 * dayMs,
        priority: 'HIGH',
        isRecurring: false,
        recurrenceInterval: 'NONE',
        subtaskTitles: [
          'List top 3 non-negotiable deliverables',
          'Identify potential blockers and risk mitigations',
          'Establish 14-day timeline'
        ]
      },
      {
        title: `Phase 2: Execution & MVP Building`,
        description: 'Implement foundational tasks and validate progress against benchmarks.',
        dueDate: now + 3 * dayMs,
        priority: 'HIGH',
        isRecurring: false,
        recurrenceInterval: 'NONE',
        subtaskTitles: [
          'Complete initial draft / prototype',
          'Conduct self-review and peer checkpoint',
          'Refine based on intermediate feedback'
        ]
      },
      {
        title: `Phase 3: Review, Polish & Final Delivery`,
        description: 'Perform quality assurance, finalize documentation, and celebrate completion.',
        dueDate: now + 6 * dayMs,
        priority: 'MEDIUM',
        isRecurring: false,
        recurrenceInterval: 'NONE',
        subtaskTitles: [
          'Final checklist audit',
          'Document learnings and next steps',
          'Archive artifacts and mark completed'
        ]
      }
    ];
  }
};
