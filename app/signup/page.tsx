'use client';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WaveHero } from '@/components/WaveHero';
import { Sparkles } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    <WaveHero className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur shadow-2xl shadow-purple-900/30 p-7 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <span className="font-semibold text-purple-900">App Generator</span>
        </div>
        <h1 className="text-xl font-semibold mb-1 text-slate-900">Create your account</h1>
        <p className="text-sm text-slate-500 mb-5">Free, no credit card.</p>
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
          <button type="submit" disabled={loading} className="btn w-full">
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="text-sm text-slate-600 mt-5 text-center">
          Have an account? <Link href="/login" className="text-purple-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </WaveHero>
  );
}
