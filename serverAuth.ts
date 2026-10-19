import type { Request, Response, NextFunction } from 'express';
import { initializeApp, cert, applicationDefault, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Extend Express Request interface to include authenticated user
export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  isDevFallback?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// State tracker for Firebase Admin initialization
let firebaseAppInstance: App | null = null;

/**
 * Initialize Firebase Admin SDK using available environment credentials
 * or the official guruai-studio project ID for token verification.
 */
export function initFirebaseAdmin(): boolean {
  if (firebaseAppInstance || getApps().length > 0) {
    return true;
  }

  try {
    // 1. Check for complete Service Account JSON string in environment
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      firebaseAppInstance = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('[Auth] Firebase Admin SDK berhasil diinisialisasi menggunakan FIREBASE_SERVICE_ACCOUNT.');
      return true;
    }

    // 2. Check for individual Service Account credentials
    const projectId = process.env.FIREBASE_PROJECT_ID || 'guruai-studio';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (projectId && clientEmail && privateKey) {
      firebaseAppInstance = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log(`[Auth] Firebase Admin SDK berhasil diinisialisasi untuk project: ${projectId}`);
      return true;
    }

    // 3. Check for standard Google Application Default Credentials (e.g., in Cloud Run)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      firebaseAppInstance = initializeApp({
        credential: applicationDefault(),
      });
      console.log('[Auth] Firebase Admin SDK berhasil diinisialisasi menggunakan GOOGLE_APPLICATION_CREDENTIALS.');
      return true;
    }

    // 4. Default Project ID initialization for cryptographic ID token verification
    firebaseAppInstance = initializeApp({
      projectId,
    });
    console.log(`[Auth] Firebase Admin SDK berhasil diinisialisasi untuk project: ${projectId}`);
    return true;
  } catch (error: any) {
    console.error('[Auth Error] Gagal menginisialisasi Firebase Admin SDK:', error?.message || error);
    return false;
  }
}

/**
 * Middleware: Verify Bearer ID Token on AI Endpoints
 * Cryptographically verifies tokens issued by Firebase Auth for project 'guruai-studio'.
 * If REQUIRE_AUTH=true, strictly rejects unauthenticated requests.
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const requireAuth = process.env.REQUIRE_AUTH === 'true';

  // 1. Extract Bearer token if provided
  let token: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. If token is provided, cryptographically verify it with Firebase Admin
  if (token) {
    if (getApps().length > 0) {
      try {
        const decodedToken = await getAuth().verifyIdToken(token);
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          isDevFallback: false,
        };
        return next();
      } catch (err: any) {
        console.warn('[Auth Warning] Token tidak valid atau kedaluwarsa:', err?.code || err?.message);
        return res.status(401).json({
          error: 'Akses ditolak: Token autentikasi tidak valid atau telah kedaluwarsa. Silakan masuk kembali.',
        });
      }
    } else {
      if (token.length < 20) {
        return res.status(401).json({
          error: 'Akses ditolak: Format token tidak valid.',
        });
      }
    }
  }

  // 3. If token is NOT provided and REQUIRE_AUTH is true
  if (requireAuth) {
    return res.status(401).json({
      error: 'Akses ditolak: Autentikasi diperlukan. Header Authorization (Bearer token) wajib disertakan.',
    });
  }

  // 4. Development / preview fallback when REQUIRE_AUTH is not explicitly forced
  req.user = {
    uid: 'local-teacher-default',
    email: 'guru@man2nganjuk.sch.id',
    name: 'Guru MAN 2 Nganjuk',
    isDevFallback: true,
  };

  next();
}

/**
 * Middleware: Verify Project Ownership
 * Ensures that users can ONLY access and modify projects they own.
 * Prevents trusting client-supplied user IDs from request parameters.
 */
export function verifyProjectOwnership(req: Request, res: Response, next: NextFunction) {
  const currentUserId = req.user?.uid;
  if (!currentUserId) {
    return res.status(401).json({ error: 'Akses ditolak: Identitas pengguna tidak ditemukan.' });
  }

  // If request contains an ownerId, verify it matches authenticated user's UID
  const bodyOwnerId = req.body?.ownerId || req.body?.parameters?.ownerId;
  if (bodyOwnerId && bodyOwnerId !== currentUserId) {
    if (req.user?.isDevFallback && (bodyOwnerId === 'local-teacher-default' || !bodyOwnerId)) {
      return next();
    }
    return res.status(403).json({
      error: 'Akses ditolak: Anda tidak memiliki hak akses terhadap proyek milik pengguna lain.',
    });
  }

  next();
}

/**
 * Account-Based AI Quota Limiter
 * Tracks and limits AI generation requests per user account (UID)
 * to prevent any single user from exhausting Gemini API quotas and budgets.
 */
interface UserQuotaConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

export function createUserQuotaLimiter(config: UserQuotaConfig) {
  const userUsage = new Map<string, { count: number; resetTime: number }>();

  // Periodically clean up expired user buckets
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [uid, entry] of userUsage.entries()) {
      if (entry.resetTime <= now) {
        userUsage.delete(uid);
      }
    }
  }, 5 * 60 * 1000);
  interval.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const uid = req.user?.uid || 'anonymous';
    const now = Date.now();
    const record = userUsage.get(uid);

    if (!record || record.resetTime <= now) {
      userUsage.set(uid, { count: 1, resetTime: now + config.windowMs });
      return next();
    }

    record.count += 1;
    if (record.count > config.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        error: config.message,
        retryAfter: retryAfterSeconds,
      });
    }

    next();
  };
}
