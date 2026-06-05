'use client';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WaveHero } from '@/components/WaveHero';
import { Sparkles } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null); setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (res?.error) setError('Invalid email or password.');
    else router.push(callbackUrl);
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-slate-600">Email</label>
          <input type="email" required className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-slate-600">Password</label>
          <input type="password" required className="input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
        <div className="h-px bg-purple-100 flex-1" /> or <div className="h-px bg-purple-100 flex-1" />
      </div>
      <div className="space-y-2">
        <button onClick={() => signIn('google', { callbackUrl })} className="btn-secondary w-full">Continue with Google</button>
        <button onClick={() => signIn('github', { callbackUrl })} className="btn-secondary w-full">Continue with GitHub</button>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <WaveHero className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur shadow-2xl shadow-purple-900/30 p-7 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <span className="font-semibold text-purple-900">App Generator</span>
        </div>
        <h1 className="text-xl font-semibold mb-1 text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-500 mb-5">Sign in to continue building.</p>
        <Suspense fallback={<div className="text-sm text-slate-500">Loading…</div>}>
          <LoginForm />
        </Suspense>
        <p className="text-sm text-slate-600 mt-5 text-center">
          No account? <Link href="/signup" className="text-purple-600 hover:underline">Sign up</Link>
        </p>
      </div>
    </WaveHero>
  );
}
