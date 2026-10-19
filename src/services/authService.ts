import { ApiService } from './apiService';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  firebaseSignOut,
  onAuthStateChanged,
  type User,
} from './firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'guru' | 'admin';
  institution?: string;
  isAnonymous?: boolean;
}

export interface AuthStatusResponse {
  firebaseConfigured: boolean;
  projectId: string;
  requireAuth: boolean;
  authProvider: string;
}

/**
 * Authentication Service
 * Connects Firebase Web SDK to the GuruAI Studio app state.
 * Automatically synchronizes JWT Bearer tokens to ApiService for backend AI verification.
 */
class AuthService {
  private currentUser: UserProfile | null = null;
  private currentFirebaseUser: User | null = null;
  private currentToken: string | null = null;
  private listeners: Array<(user: UserProfile | null) => void> = [];
  private isInitialized = false;

  constructor() {
    // Listen to Firebase Auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      this.currentFirebaseUser = firebaseUser;
      if (firebaseUser) {
        try {
          // Retrieve the current ID token
          const token = await firebaseUser.getIdToken();
          this.currentToken = token;
          ApiService.setAuthToken(token);

          this.currentUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guru Tamu' : 'Guru Madrasah'),
            photoURL: firebaseUser.photoURL,
            role: 'guru',
            institution: 'MAN 2 Nganjuk',
            isAnonymous: firebaseUser.isAnonymous,
          };

          // Save local session metadata
          localStorage.setItem('guruai_user_session', JSON.stringify(this.currentUser));
        } catch (err) {
          console.error('[AuthService] Gagal mengambil ID token:', err);
        }
      } else {
        this.currentToken = null;
        this.currentUser = null;
        ApiService.setAuthToken(null);
        localStorage.removeItem('guruai_user_session');
      }

      this.isInitialized = true;
      this.notify();
    });

    // Fallback: If not online or during initial mount before Firebase resolves
    const saved = localStorage.getItem('guruai_user_session');
    if (saved && !this.currentUser) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch {
        localStorage.removeItem('guruai_user_session');
      }
    }
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public getRawUser(): User | null {
    return this.currentFirebaseUser;
  }

  public async getIdToken(forceRefresh = false): Promise<string | null> {
    if (this.currentFirebaseUser) {
      try {
        const token = await this.currentFirebaseUser.getIdToken(forceRefresh);
        this.currentToken = token;
        ApiService.setAuthToken(token);
        return token;
      } catch (err) {
        console.error('[AuthService] Error refreshing ID token:', err);
      }
    }
    return this.currentToken;
  }

  public onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    this.listeners.push(callback);
    if (this.isInitialized) {
      callback(this.currentUser);
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentUser);
      } catch (e) {
        console.error('[AuthService] Listener error:', e);
      }
    }
  }

  /**
   * Sign In with Google Popup
   */
  public async signInWithGoogle(): Promise<UserProfile> {
    const credential = await signInWithPopup(auth, googleProvider);
    const token = await credential.user.getIdToken();
    ApiService.setAuthToken(token);

    const user: UserProfile = {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName || 'Guru',
      photoURL: credential.user.photoURL,
      role: 'guru',
      institution: 'MAN 2 Nganjuk',
      isAnonymous: false,
    };

    this.currentUser = user;
    this.currentToken = token;
    localStorage.setItem('guruai_user_session', JSON.stringify(user));
    this.notify();
    return user;
  }

  /**
   * Sign in with Email and Password
   */
  public async signInWithEmail(email: string, pass: string): Promise<UserProfile> {
    const credential = await signInWithEmailAndPassword(auth, email, pass);
    const token = await credential.user.getIdToken();
    ApiService.setAuthToken(token);

    const user: UserProfile = {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName || email.split('@')[0],
      photoURL: credential.user.photoURL,
      role: 'guru',
      institution: 'MAN 2 Nganjuk',
      isAnonymous: false,
    };

    this.currentUser = user;
    this.currentToken = token;
    localStorage.setItem('guruai_user_session', JSON.stringify(user));
    this.notify();
    return user;
  }

  /**
   * Register with Email and Password
   */
  public async registerWithEmail(email: string, pass: string, name?: string): Promise<UserProfile> {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    const token = await credential.user.getIdToken();
    ApiService.setAuthToken(token);

    const user: UserProfile = {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: name || email.split('@')[0],
      photoURL: null,
      role: 'guru',
      institution: 'MAN 2 Nganjuk',
      isAnonymous: false,
    };

    this.currentUser = user;
    this.currentToken = token;
    localStorage.setItem('guruai_user_session', JSON.stringify(user));
    this.notify();
    return user;
  }

  /**
   * Sign in anonymously as guest guru
   */
  public async signInAsGuest(): Promise<UserProfile> {
    try {
      const credential = await signInAnonymously(auth);
      const token = await credential.user.getIdToken();
      ApiService.setAuthToken(token);

      const user: UserProfile = {
        uid: credential.user.uid,
        email: null,
        displayName: 'Guru Tamu (Pratinjau)',
        photoURL: null,
        role: 'guru',
        institution: 'MAN 2 Nganjuk',
        isAnonymous: true,
      };

      this.currentUser = user;
      this.currentToken = token;
      localStorage.setItem('guruai_user_session', JSON.stringify(user));
      this.notify();
      return user;
    } catch (err: any) {
      // In case anonymous auth is disabled in Firebase console, provide a safe local guest profile
      console.warn('[AuthService] Anonymous auth tidak aktif di console, menggunakan fallback lokal:', err?.message);
      const guestId = 'guest-' + Math.random().toString(36).substring(2, 9);
      const user: UserProfile = {
        uid: guestId,
        email: null,
        displayName: 'Guru Tamu (Lokal)',
        photoURL: null,
        role: 'guru',
        institution: 'MAN 2 Nganjuk',
        isAnonymous: true,
      };
      this.currentUser = user;
      this.notify();
      return user;
    }
  }

  /**
   * Sign Out
   */
  public async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('[AuthService] Firebase signOut error:', e);
    }
    this.currentFirebaseUser = null;
    this.currentUser = null;
    this.currentToken = null;
    ApiService.setAuthToken(null);
    localStorage.removeItem('guruai_user_session');
    this.notify();
  }

  /**
   * Check backend authentication enforcement status
   */
  public async checkBackendAuthStatus(): Promise<AuthStatusResponse> {
    try {
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch auth status:', err);
    }
    return {
      firebaseConfigured: true,
      projectId: 'guruai-studio',
      requireAuth: false,
      authProvider: 'firebase-auth',
    };
  }
}

export const authService = new AuthService();
