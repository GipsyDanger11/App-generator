'use client';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || 'Failed to sign up');
      setLoading(false);
      return;
    }
    const r = await signIn('credentials', { email, password, redirect: false, callbackUrl: '/dashboard' });
    setLoading(false);
    if (r?.error) setError('Account created, but sign-in failed.');
    else router.push('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm card p-6">
        <h1 className="text-xl font-semibold mb-4">Create your account</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-slate-600">Name</label>
            <input required className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-600">Email</label>
            <input type="email" required className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-600">Password</label>
            <input type="password" required minLength={8} className="input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-slate-500 mt-1">At least 8 characters.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn w-full justify-center">
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="text-sm text-slate-600 mt-4 text-center">
          Have an account? <Link href="/login" className="text-brand-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
