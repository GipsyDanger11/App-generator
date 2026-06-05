import { AlertTriangle } from 'lucide-react';

export function UnknownComponent({ kind }: { kind?: string }) {
  return (
    <div className="my-2 rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      <span className="inline-flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Unknown component{kind ? `: "${kind}"` : ''} — safely ignored.
      </span>
    </div>
  );
}
