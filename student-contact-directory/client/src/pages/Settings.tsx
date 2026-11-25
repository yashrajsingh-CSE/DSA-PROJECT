import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const perms: [string, boolean][] = [
    ['View and search the directory', true], ['View student details', true], ['Add, edit and delete students', isAdmin],
    ['Import students from CSV', isAdmin], ['Export students to CSV', isAdmin],
  ];
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-secondary">Account</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div><dt className="text-xs uppercase text-muted">Name</dt><dd className="font-medium">{user?.name}</dd></div>
          <div><dt className="text-xs uppercase text-muted">Email</dt><dd className="break-all font-medium">{user?.email}</dd></div>
          <div><dt className="text-xs uppercase text-muted">Role</dt><dd className="font-medium capitalize">{user?.role}</dd></div>
        </dl>
      </div>
      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-secondary"><ShieldCheck className="h-5 w-5 text-primary" /> Your permissions</h2>
        <ul className="space-y-2 text-sm">{perms.map(([p, ok]) => <li key={p} className={ok ? '' : 'text-muted line-through'}>{ok ? '✓' : '✗'} {p}</li>)}</ul>
      </div>
    </div>
  );
}
