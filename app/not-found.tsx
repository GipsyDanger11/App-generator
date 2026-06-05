import Link from 'next/link';
import { WaveHero } from '@/components/WaveHero';

export default function NotFound() {
  return (
    <WaveHero className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center relative z-10">
        <h1 className="text-6xl font-bold text-white">404</h1>
        <p className="text-purple-100 mt-2">This page doesn&apos;t exist.</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-1 rounded-md bg-white text-purple-700 px-5 py-2.5 font-semibold hover:bg-purple-50">Go home</Link>
      </div>
    </WaveHero>
  );
}
