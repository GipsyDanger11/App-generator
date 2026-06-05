'use client';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
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
        <button type="submit" disabled={loading} className="btn w-full justify-center">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
        <div className="h-px bg-slate-200 flex-1" /> or <div className="h-px bg-slate-200 flex-1" />
      </div>
      <div className="space-y-2">
        <button onClick={() => signIn('google', { callbackUrl })} className="btn-secondary w-full justify-center">Continue with Google</button>
        <button onClick={() => signIn('github', { callbackUrl })} className="btn-secondary w-full justify-center">Continue with GitHub</button>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm card p-6">
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>
        <Suspense fallback={<div className="text-sm text-slate-500">Loading…</div>}>
          <LoginForm />
        </Suspense>
        <p className="text-sm text-slate-600 mt-4 text-center">
          No account? <Link href="/signup" className="text-brand-600 hover:underline">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
