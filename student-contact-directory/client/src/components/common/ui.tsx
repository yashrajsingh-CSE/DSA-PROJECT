import { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

export const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status === 'Active' ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>{status}</span>
);

export const Avatar = ({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) => {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  return <div className={`flex shrink-0 items-center justify-center rounded-full bg-primary-light font-semibold text-primary ${size === 'lg' ? 'h-20 w-20 text-2xl' : 'h-9 w-9 text-sm'}`}>{initials}</div>;
};

export const Spinner = ({ label = 'Loading...' }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-muted"><Loader2 className="h-5 w-5 animate-spin" /> {label}</div>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center gap-3 py-12 text-center">
    <AlertCircle className="h-8 w-8 text-danger" /><p className="text-sm text-muted">{message}</p>
    {onRetry && <button className="btn-secondary" onClick={onRetry}>Try again</button>}
  </div>
);

export const EmptyState = ({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center gap-2 py-12 text-center">
    <Inbox className="h-8 w-8 text-slate-400" /><p className="font-medium">{title}</p>
    {hint && <p className="text-sm text-muted">{hint}</p>}{action}
  </div>
);

export const Skeleton = ({ className = '' }: { className?: string }) => <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
