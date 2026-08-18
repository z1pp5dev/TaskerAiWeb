# Tasker AI — Web Application (React + TypeScript + Vite + Tailwind CSS)

Tasker AI Web is a high-performance productivity engine ported from the native Android Jetpack Compose application. It features natural language task scheduling, automated AI goal breakdowns, subtask checklists, cascading category architecture, and a 100% client-side **"BYOK Freemium"** monetization model.

---

## Key Features

1. **Jetpack Compose Native Design System**
   - Bespoke Dark Slate & Zinc Canvas (`#090d16` / `#131b2e`).
   - High & Urgent Priority left vertical accent bars (matching Android `border-l-4`).
   - Micro-interactions on buttons (`active:scale-[0.98]`).
   - Strike-through completion animations & confetti celebrations upon completing all daily focus tasks.

2. **Full State & Task Management**
   - **Task CRUD**: Create, edit, delete, drag-and-drop reorder.
   - **Subtask Checklists**: Expandable checklist progress bars directly on cards and in the editor.
   - **Habits & Recurrence**: Automatic recurring habit spawning (Daily, Weekly, Monthly, Yearly).
   - **Category Manager**: Add, edit, and rename categories with instant cascading updates to all associated tasks.
   - **7-Day Date Strip**: Filter tasks by day or switch to the Completed History Archive.

3. **BYOK Freemium Monetization Model**
   - **Mode A: Free Demo (Default Limited Tier)**
     - 3 trial AI breakdowns & Smart Add runs.
     - Up to 3 custom categories.
     - Unlimited basic tasks & checklists.
   - **Mode B: BYOK (Bring Your Own Key - Unlocked Tier)**
     - Enter your personal Google Gemini API Key (`AIza...`) in Settings.
     - Runs 100% client-side with `@google/genai` (direct to Google Gemini 2.5 Flash / 1.5 Flash / 2.5 Pro).
     - Automatically removes the 3-category cap and unlocks **unlimited AI generations & unlimited custom categories** forever at zero extra cost.
   - **Mode C: Tasker Pro (Hosted Web Simulation)**
     - Pricing tier simulation for hosted cloud generation.

4. **AI Generation Engine (`src/services/geminiService.ts`)**
   - **Smart Add (Natural Language Parser)**: Extracts title, description, recurrence, priority, and due dates from phrases like *"Sync with team tomorrow at 2 PM with high priority"*.
   - **Voice Dictation**: Uses Web Speech API (`webkitSpeechRecognition`) for voice task input matching Android `RecognizerIntent`.
   - **AI Goal Breakdown Assistant**: Breaks high-level goals into 3-5 structured milestones with subtask checklists.
   - **Resilient Fallback**: Smart client-side heuristic engine if network is offline or in demo mode.

5. **Data Management & Backup**
   - Client-side persistence in `localStorage`.
   - One-click JSON backup export & restore.
   - Reset to initial sample onboarding tasks.

---

## Local Development & Setup

### Prerequisites
- Node.js (v18+) & npm / yarn / pnpm

### Quick Start
```bash
# Navigate to web application
cd tasker-ai-web

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Project Structure

```
tasker-ai-web/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
└── src/
    ├── main.tsx               # App entry point
    ├── index.css              # Custom Tailwind theme, glass cards, scrollbar
    ├── types/
    │   └── index.ts           # TaskItem, SubTask, Category, Priority, BYOKConfig schemas
    ├── services/
    │   ├── geminiService.ts   # Gemini API client, NLP parser, Goal Breakdown, API key validation
    │   └── storageService.ts  # LocalStorage persistence, seed data, cascading updates, backup
    ├── components/
    │   ├── GoalInput.tsx          # Focus stats bar, progress ring, Smart Add voice input, search
    │   ├── DateStrip.tsx          # 7-day horizontal date filter strip
    │   ├── CategoryManager.tsx    # Category pills bar + Add/Edit/Delete category modal with cascade
    │   ├── TaskManager.tsx        # Drag-and-drop task list, empty states
    │   ├── TaskCard.tsx           # Card with left accent bar, priority badge, category badge, recurrence, subtask progress
    │   ├── AddEditTaskModal.tsx   # Add/Edit task dialog with subtask checklist manager
    │   ├── AiBreakdownModal.tsx   # AI Goal breakdown modal with preset suggestions & preview
    │   ├── SettingsModal.tsx      # BYOK Gemini API key input, live validation test, model selector, data backup
    │   ├── UpgradeModal.tsx       # 3-tier monetization comparison modal
    │   ├── HistoryArchive.tsx     # Completed tasks archive view with restore and clear-all
    │   └── Toast.tsx              # Toast notification system
    └── App.tsx                # Main application layout, top bar, tier indicator banner
```
