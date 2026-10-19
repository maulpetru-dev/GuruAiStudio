import React, { useState } from 'react';
import { LogIn, UserPlus, KeyRound, Mail, AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { authService, UserProfile } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const user = await authService.signInWithGoogle();
      onSuccess?.(user);
      onClose();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      // Friendly message for Firebase popup issues or blocked popups
      if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('Jendela popup diblokir oleh peramban. Izinkan popup untuk login dengan Google.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Proses masuk Google dibatalkan.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMessage('Domain ini belum terdaftar di Firebase Authorized Domains. Gunakan opsi Tamu atau Email.');
      } else {
        setErrorMessage(err?.message || 'Gagal masuk dengan Google. Periksa koneksi internet Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Email dan kata sandi wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      let user: UserProfile;
      if (mode === 'register') {
        user = await authService.registerWithEmail(email, password, name);
      } else {
        user = await authService.signInWithEmail(email, password);
      }
      onSuccess?.(user);
      onClose();
    } catch (err: any) {
      console.error('Email auth error:', err);
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setErrorMessage('Email atau kata sandi tidak sesuai.');
      } else if (err?.code === 'auth/email-already-in-use') {
        setErrorMessage('Alamat email sudah terdaftar. Silakan masuk.');
      } else if (err?.code === 'auth/invalid-email') {
        setErrorMessage('Format alamat email tidak valid.');
      } else if (err?.code === 'auth/operation-not-allowed') {
        setErrorMessage('Metode Email/Password belum diaktifkan di Firebase Console. Gunakan Google atau Akun Tamu.');
      } else {
        setErrorMessage(err?.message || 'Terjadi kesalahan saat autentikasi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const user = await authService.signInAsGuest();
      onSuccess?.(user);
      onClose();
    } catch (err: any) {
      console.error('Guest auth error:', err);
      setErrorMessage('Gagal masuk sebagai tamu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Autentikasi Guru Pendidik</h2>
              <p className="text-xs text-emerald-200/80">Firebase Authentication (guruai-studio)</p>
            </div>
          </div>
          <p className="text-xs text-emerald-100/90 leading-relaxed mt-2">
            Masuk untuk menyimpan perangkat ajar secara aman di akun Anda dan mengakses model AI Kurikulum Merdeka.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all shadow-xs cursor-pointer disabled:opacity-60 min-h-[44px]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk dengan Akun Google</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Atau dengan Email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi, M.Pd.I."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guru@madrasah.sch.id"
                  required
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-900 py-2.5 px-4 text-sm font-bold text-white hover:bg-emerald-800 active:scale-98 transition-all shadow-xs cursor-pointer disabled:opacity-60 min-h-[44px]"
            >
              {mode === 'signin' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              <span>{loading ? 'Memproses...' : mode === 'signin' ? 'Masuk' : 'Daftar Akun Baru'}</span>
            </button>
          </form>

          {/* Toggle Signin/Register & Guest */}
          <div className="pt-2 flex flex-col gap-2 text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'register' : 'signin');
                setErrorMessage(null);
              }}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold cursor-pointer"
            >
              {mode === 'signin'
                ? 'Belum punya akun? Daftar di sini'
                : 'Sudah punya akun? Masuk di sini'}
            </button>

            <button
              onClick={handleGuestSignIn}
              disabled={loading}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium py-1 cursor-pointer"
            >
              Lanjutkan sebagai Tamu (Mode Pratinjau Terbatas)
            </button>
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Token terverifikasi RSA-256 oleh Firebase Admin
          </span>
          <span className="font-mono text-[10px]">guruai-studio</span>
        </div>
      </div>
    </div>
  );
};
