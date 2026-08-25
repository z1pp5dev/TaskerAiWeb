import { TaskItem, Category } from '../types';

export interface GoogleDriveUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

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
  data?: GoogleDriveSyncData | null;
}

const STORAGE_KEYS = {
  CLIENT_ID: 'tasker_ai_google_client_id_v1',
  AUTH_TOKEN: 'tasker_ai_google_auth_token_v1',
  USER_PROFILE: 'tasker_ai_google_user_profile_v1',
  LAST_SYNC: 'tasker_ai_google_last_sync_v1'
};

const DRIVE_FILE_NAME = 'TaskerAI_Backup.json';
const DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

type AuthListener = (user: GoogleDriveUser | null) => void;

class GoogleDriveService {
  private accessToken: string | null = null;
  private user: GoogleDriveUser | null = null;
  private listeners: Set<AuthListener> = new Set();
  private isScriptLoaded: boolean = false;
  private driveFileId: string | null = null;
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

        // Request token cleanly
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
        picture: data.picture
      };
    } catch (e) {
      console.error('Error fetching Google user profile:', e);
      return null;
    }
  }

  signOut(): void {
    this.accessToken = null;
    this.user = null;
    this.driveFileId = null;
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

  // --- GOOGLE DRIVE FILE API ---
  private async getOrCreateDriveFileId(): Promise<{ fileId: string | null; error?: string }> {
    if (this.driveFileId) return { fileId: this.driveFileId };
    if (!this.accessToken) return { fileId: null, error: 'Not authenticated with Google.' };

    try {
      // 1. Search for existing TaskerAI_Backup.json
      const query = encodeURIComponent(`name = '${DRIVE_FILE_NAME}' and trashed = false`);
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)&spaces=drive`;
      const searchResp = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      if (!searchResp.ok) {
        const errJson = await searchResp.json().catch(() => null);
        const errMsg = errJson?.error?.message || '';
        
        if (searchResp.status === 403 && (errMsg.includes('disabled') || errMsg.includes('has not been used in project') || errMsg.includes('Access Not Configured'))) {
          const apiDisabledMsg = 'Google Drive API is disabled in your Google Cloud Project. Please enable it at https://console.cloud.google.com/apis/library/drive.googleapis.com';
          console.error(apiDisabledMsg, errJson);
          return { fileId: null, error: apiDisabledMsg };
        }

        if (searchResp.status === 401) {
          this.signOut();
          return { fileId: null, error: 'Google session expired. Please sign in again.' };
        }

        return { fileId: null, error: errMsg || `Google Drive error (HTTP ${searchResp.status})` };
      }

      const searchData = await searchResp.json();
      if (searchData.files && searchData.files.length > 0) {
        this.driveFileId = searchData.files[0].id;
        return { fileId: this.driveFileId };
      }

      // 2. Create if not found
      const metadata = {
        name: DRIVE_FILE_NAME,
        mimeType: 'application/json',
        description: 'Tasker AI Cloud Backup & Sync File'
      };

      const initialData: GoogleDriveSyncData = {
        tasks: [],
        categories: [],
        lastSyncedAt: Date.now(),
        version: '1.0.0'
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(initialData) +
        closeDelimiter;

      const createResp = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: multipartRequestBody
        }
      );

      if (createResp.ok) {
        const createData = await createResp.json();
        this.driveFileId = createData.id;
        return { fileId: this.driveFileId };
      }

      const createErr = await createResp.json().catch(() => null);
      const createMsg = createErr?.error?.message || '';
      if (createResp.status === 403 && (createMsg.includes('disabled') || createMsg.includes('has not been used in project'))) {
        const apiDisabledMsg = 'Google Drive API is disabled in your Google Cloud Project. Please enable it at https://console.cloud.google.com/apis/library/drive.googleapis.com';
        return { fileId: null, error: apiDisabledMsg };
      }

      return { fileId: null, error: createMsg || `Failed to create backup file (HTTP ${createResp.status})` };
    } catch (e: any) {
      console.error('Failed to get or create Google Drive backup file:', e);
      return { fileId: null, error: e?.message || 'Network error connecting to Google Drive.' };
    }
  }

  async loadFromDrive(): Promise<GoogleDriveSyncData | null> {
    const { fileId, error } = await this.getOrCreateDriveFileId();
    if (!fileId || !this.accessToken) {
      if (error) console.warn('loadFromDrive:', error);
      return null;
    }

    try {
      const resp = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        }
      );

      if (!resp.ok) return null;
      const data = await resp.json();
      return data;
    } catch (e) {
      console.error('Failed to load tasks from Google Drive:', e);
      return null;
    }
  }

  async saveToDrive(tasks: TaskItem[], categories: Category[]): Promise<GoogleDriveSyncResult> {
    const { fileId, error } = await this.getOrCreateDriveFileId();
    if (!fileId || !this.accessToken) {
      return { success: false, error: error || 'Could not access Google Drive file.' };
    }

    try {
      const syncData: GoogleDriveSyncData = {
        tasks,
        categories,
        lastSyncedAt: Date.now(),
        version: '1.0.0'
      };

      const resp = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(syncData, null, 2)
        }
      );

      if (resp.ok) {
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
        return { success: true, data: syncData };
      }

      const patchErr = await resp.json().catch(() => null);
      const patchMsg = patchErr?.error?.message || `HTTP ${resp.status}`;
      return { success: false, error: patchMsg };
    } catch (e: any) {
      console.error('Failed to save tasks to Google Drive:', e);
      return { success: false, error: e?.message || 'Network error saving to Google Drive.' };
    }
  }
}

export const googleDriveService = new GoogleDriveService();
