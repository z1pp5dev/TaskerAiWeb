import { TaskItem, Category, BYOKConfig } from '../types';
import { AppDataBackup, ProUserData } from '../types/sync';

export interface GoogleUserData {
  id?: string;
  email: string;
  name: string;
  picture?: string;
  accessToken?: string;
}

export type GoogleDriveUser = GoogleUserData;

export type { AppDataBackup, ProUserData };

export interface GoogleDriveSyncData {
  tasks: TaskItem[];
  categories: Category[];
  lastSyncedAt: number;
  version: string;
}

export interface GoogleDriveSyncResult {
  success: boolean;
  error?: string;
  mergedTasksCount?: number;
  data?: AppDataBackup | null;
}

const STORAGE_KEYS = {
  CLIENT_ID: 'tasker_ai_google_client_id_v1',
  AUTH_TOKEN: 'tasker_ai_google_auth_token_v1',
  USER_PROFILE: 'tasker_ai_google_user_profile_v1',
  LAST_SYNC: 'tasker_ai_google_last_sync_v1'
};

const BACKUP_FILENAME = 'tasker_ai_backup.json';
const DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

// Helper to find existing backup file ID in appDataFolder
export async function getBackupFileId(accessToken: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`name = '${BACKUP_FILENAME}' and 'appDataFolder' in parents and trashed = false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${query}&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.files && data.files.length > 0 ? data.files[0].id : null;
  } catch (e) {
    console.error('Failed to get backup file ID:', e);
    return null;
  }
}

// Download existing backup from Google Drive
export async function loadFromGoogleDrive(accessToken: string): Promise<AppDataBackup | null> {
  const fileId = await getBackupFileId(accessToken);
  if (!fileId) return null;

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Failed to load backup from Google Drive:', e);
    return null;
  }
}

// Save or Update backup in Google Drive appDataFolder
export async function saveToGoogleDrive(accessToken: string, data: AppDataBackup): Promise<boolean> {
  const fileId = await getBackupFileId(accessToken);
  const fileContent = JSON.stringify(data, null, 2);
  const blob = new Blob([fileContent], { type: 'application/json' });

  try {
    if (fileId) {
      // Update existing file
      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: fileContent
      });
      return res.ok;
    } else {
      // Create new file with metadata in appDataFolder
      const metadata = {
        name: BACKUP_FILENAME,
        parents: ['appDataFolder']
      };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form
      });
      return res.ok;
    }
  } catch (e) {
    console.error('Failed to save backup to Google Drive:', e);
    return false;
  }
}

type AuthListener = (user: GoogleDriveUser | null) => void;

export class GoogleDriveService {
  private accessToken: string | null = null;
  private user: GoogleDriveUser | null = null;
  private listeners: Set<AuthListener> = new Set();
  private isScriptLoaded: boolean = false;
  public static readonly DEFAULT_CLIENT_ID = '960653031660-1slrc8pphji9qj8obnnd3v59avp65nnu.apps.googleusercontent.com';

  constructor() {
    this.restoreSession();
  }

  // --- CONFIGURATION ---
  getClientId(): string {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CLIENT_ID);
      if (stored && stored.trim()) return stored.trim();
    } catch (e) {}

    const envId = (import.meta.env?.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
    if (envId) return envId;

    return GoogleDriveService.DEFAULT_CLIENT_ID;
  }

  saveClientId(clientId: string): void {
    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, clientId.trim());
  }

  isConfigured(): boolean {
    return true;
  }

  // --- SCRIPT LOADER ---
  loadGoogleScript(): Promise<boolean> {
    if (this.isScriptLoaded && (window as any).google?.accounts?.oauth2) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      if (document.getElementById('google-gsi-script')) {
        this.isScriptLoaded = true;
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load Google Identity Services script.');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  // --- SESSION RESTORATION ---
  private restoreSession(): void {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userStr = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (token && userStr) {
        this.accessToken = token;
        this.user = JSON.parse(userStr);
      }
    } catch (e) {
      console.warn('Failed to restore Google session:', e);
    }
  }

  getUser(): GoogleDriveUser | null {
    return this.user;
  }

  getAccessToken(): string | null {
    return this.accessToken || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  getLastSyncTime(): number | null {
    try {
      const ms = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return ms ? parseInt(ms, 10) : null;
    } catch (e) {
      return null;
    }
  }

  onAuthStateChange(callback: AuthListener): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.user);
      } catch (e) {
        console.error('Auth listener error:', e);
      }
    });
  }

  loginAsUser(name: string, email: string, picture?: string): GoogleDriveUser {
    const cleanEmail = (email || 'user@gmail.com').trim().toLowerCase();
    const cleanName = (name || cleanEmail.split('@')[0] || 'Google User').trim();
    const profile: GoogleDriveUser = {
      id: 'google_user_' + Math.abs(cleanEmail.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      email: cleanEmail,
      picture: picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0D8ABC&color=fff&bold=true`
    };
    this.user = profile;
    this.accessToken = 'google_session_' + Date.now();
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, this.accessToken);
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    this.notifyListeners();
    return profile;
  }

  // --- SIGN IN WITH GOOGLE ---
  async signInWithGoogle(customClientId?: string): Promise<{ success: boolean; error?: string }> {
    const clientId = customClientId || this.getClientId() || GoogleDriveService.DEFAULT_CLIENT_ID;

    await this.loadGoogleScript();

    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      return {
        success: false,
        error: 'Google Identity Services SDK could not be loaded. Please check your internet connection.'
      };
    }

    return new Promise((resolve) => {
      try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: DRIVE_SCOPES,
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              const errStr = String(tokenResponse.error_description || tokenResponse.error);
              if (errStr.includes('origin') || tokenResponse.error === 'idpiframe_initialization_failed') {
                resolve({
                  success: false,
                  error: 'Google Sign-In requires running through a local server (e.g. http://localhost:3000 or http://localhost:5173).'
                });
                return;
              }
              resolve({
                success: false,
                error: errStr
              });
              return;
            }

            this.accessToken = tokenResponse.access_token;
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, this.accessToken as string);

            // Fetch user profile info
            const profile = await this.fetchUserProfile(this.accessToken as string);
            if (profile) {
              this.user = profile;
              localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
              this.notifyListeners();
              resolve({ success: true });
            } else {
              const fallback: GoogleDriveUser = {
                id: 'google_user_' + Date.now(),
                name: 'Google User',
                email: 'user@gmail.com'
              };
              this.user = fallback;
              localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(fallback));
              this.notifyListeners();
              resolve({ success: true });
            }
          }
        });

        tokenClient.requestAccessToken();
      } catch (e: any) {
        resolve({
          success: false,
          error: e?.message || 'Failed to start Google sign in.'
        });
      }
    });
  }

  private async fetchUserProfile(token: string): Promise<GoogleDriveUser | null> {
    try {
      const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      return {
        id: data.sub,
        name: data.name || data.given_name || 'Google User',
        email: data.email,
        picture: data.picture,
        accessToken: token
      };
    } catch (e) {
      console.error('Error fetching Google user profile:', e);
      return null;
    }
  }

  signOut(): void {
    this.accessToken = null;
    this.user = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    this.notifyListeners();
  }

  disconnectAccount(): void {
    if (this.accessToken && (window as any).google?.accounts?.oauth2) {
      try {
        (window as any).google.accounts.oauth2.revoke(this.accessToken, () => {});
      } catch (e) {}
    }
    this.signOut();
  }

  async loadFromDrive(): Promise<AppDataBackup | null> {
    const token = this.getAccessToken();
    if (!token) return null;
    return await loadFromGoogleDrive(token);
  }

  async saveToDrive(
    tasks: TaskItem[],
    categories: Category[],
    brainDump?: string,
    byokConfig?: BYOKConfig,
    proUser?: ProUserData
  ): Promise<GoogleDriveSyncResult> {
    const token = this.getAccessToken();
    if (!token) {
      return { success: false, error: 'Not authenticated with Google.' };
    }

    const formattedTasks = tasks.map((t) => ({
      id: String(t.id),
      categoryId: t.categoryId ? String(t.categoryId) : '',
      title: t.title,
      description: t.description || '',
      dueDate: t.dueDate ?? null,
      isCompleted: Boolean(t.isCompleted),
      isDeleted: Boolean(t.isDeleted),
      priority: (t.priority === 'HIGH' || t.priority === 'URGENT' ? 'High' : t.priority === 'LOW' ? 'Low' : 'Medium') as "High" | "Medium" | "Low",
      isRecurring: Boolean(t.isRecurring),
      recurrenceInterval: t.recurrenceInterval || 'NONE',
      hasAlarm: Boolean(t.hasAlarm),
      sortOrder: t.sortOrder,
      createdAt: typeof t.createdAt === 'number' ? new Date(t.createdAt).toISOString() : String(t.createdAt || new Date().toISOString()),
      updatedAt: typeof t.updatedAt === 'number' ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
      subtasks: t.subtasks || []
    }));

    const formattedCategories = categories.map((c) => ({
      id: String(c.id),
      name: c.name,
      color: c.color || '#a855f7',
      icon: c.icon
    }));

    const userStatus: ProUserData = proUser || {
      isPro: false,
      proUnlockType: 'none',
      proExpiresAt: null
    };

    const backupData: AppDataBackup = {
      version: '1.0.0',
      lastSynced: new Date().toISOString(),
      user: userStatus,
      categories: formattedCategories,
      tasks: formattedTasks,
      brainDump: brainDump || '',
      byokConfig
    };

    const ok = await saveToGoogleDrive(token, backupData);
    if (ok) {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
      return { success: true, data: backupData };
    } else {
      return { success: false, error: 'Failed to sync with Google Drive appDataFolder.' };
    }
  }
}

export const googleDriveService = new GoogleDriveService();
