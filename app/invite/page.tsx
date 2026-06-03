'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function InvitePage() {
  const [isPending, setIsPending] = useState(false);

  const handleLogin = async () => {
    setIsPending(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      console.error(error);
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 font-sans selection:bg-cyan-500/30">
      {/* 背景の装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] h-[50%] w-[50%] rounded-full bg-cyan-900/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] h-[50%] w-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-950 ring-1 ring-cyan-800">
              <Lock className="h-8 w-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              社内専用アクセス
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              このサービスを利用するには社内のGoogleアカウントでログインしてください。
            </p>
          </div>

          <div className="space-y-6">
            <Button
              onClick={handleLogin}
              className="w-full bg-white hover:bg-slate-200 text-slate-900 font-medium transition-colors"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-900" />
                  認証中...
                </>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  Googleでログイン
                </div>
              )}
            </Button>
          </div>
        </div>
        
        <p className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} paijang. All rights reserved.
        </p>
      </div>
    </div>
  );
}
