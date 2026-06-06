'use client';
import { CompProps } from '../registry';
import { useT } from '../useT';
import {
  LayoutGrid, Users, DollarSign, FileText, Star,
  Package, Calendar, Settings, BarChart2, Hash,
} from 'lucide-react';

// Pick an icon based on card title keywords
function iconForTitle(title: string): React.ElementType | null {
  if (!title) return null;
  const l = title.toLowerCase();
  if (l.includes('user') || l.includes('customer') || l.includes('member') || l.includes('people')) return Users;
  if (l.includes('revenue') || l.includes('money') || l.includes('amount') || l.includes('price') || l.includes('cost')) return DollarSign;
  if (l.includes('document') || l.includes('file') || l.includes('report') || l.includes('note')) return FileText;
  if (l.includes('rating') || l.includes('review') || l.includes('star') || l.includes('favorite')) return Star;
  if (l.includes('product') || l.includes('item') || l.includes('inventory') || l.includes('stock')) return Package;
  if (l.includes('event') || l.includes('date') || l.includes('schedule') || l.includes('calendar')) return Calendar;
  if (l.includes('setting') || l.includes('config') || l.includes('option') || l.includes('preference')) return Settings;
  if (l.includes('chart') || l.includes('metric') || l.includes('stat') || l.includes('analytics')) return BarChart2;
  if (l.includes('overview') || l.includes('dashboard') || l.includes('summary') || l.includes('grid')) return LayoutGrid;
  return Hash;
}

export function Card({ node, children }: CompProps) {
  const t = useT();
  const title = t((node.props?.title as string) ?? '', (node.props?.title as string) ?? '');
  const description = (node.props?.description as string) ?? '';
  const link = node.props?.link as { href: string; label: string } | undefined;
  const Icon = iconForTitle(title);

  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-200">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="shrink-0 rounded-lg bg-brand-50 p-2.5 group-hover:bg-brand-100 transition-colors">
            <Icon className="h-5 w-5 text-brand-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-base font-semibold text-slate-900 leading-snug">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="text-slate-700 mt-3">{children}</div>}
      {link?.href && (
        <a
          href={link.href}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          {link.label || 'View'}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      )}
    </div>
  );
}
