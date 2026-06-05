import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-slate-500 py-6 justify-center', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ message, className }: { message?: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2', className)}>
      <AlertCircle className="h-4 w-4" />
      {message || 'Something went wrong.'}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-10 text-slate-500">
      <div className="text-sm font-medium text-slate-700">{title}</div>
      {hint && <div className="text-xs mt-1">{hint}</div>}
    </div>
  );
}
