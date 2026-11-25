import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, UserCheck, UserX, UserPlus, Upload, Download, List } from 'lucide-react';
import { api, downloadFile, getError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, EmptyState, ErrorState, Skeleton, StatusBadge } from '../components/common/ui';
import { DistItem, Stats, Student } from '../types';

function Bars({ items, color }: { items: DistItem[]; color: string }) {
  if (!items.length) return <EmptyState title="No data yet" />;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex justify-between text-sm"><span>{i.label}</span><span className="font-medium">{i.count}</span></div>
          <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full transition-all" style={{ width: `${(i.count / max) * 100}%`, background: color }} /></div>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const { isAdmin } = useAuth(); const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Student[]>([]);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [s, r] = await Promise.all([api.get('/dashboard/stats'), api.get('/dashboard/recent-students')]);
      setStats(s.data.data); setRecent(r.data.data);
    } catch (e) { setError(getError(e, 'Failed to load dashboard').message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (error) return <div className="card"><ErrorState message={error} onRetry={load} /></div>;

  const cards = [
    { label: 'Total Students', value: stats?.totalStudents, icon: Users, tone: 'bg-blue-50 text-blue-600' },
    { label: 'Total Departments', value: stats?.totalDepartments, icon: Building2, tone: 'bg-violet-50 text-violet-600' },
    { label: 'Active Students', value: stats?.activeStudents, icon: UserCheck, tone: 'bg-green-50 text-green-600' },
    { label: 'Inactive Students', value: stats?.inactiveStudents, icon: UserX, tone: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card flex items-center gap-4 p-5">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}><Icon className="h-6 w-6" /></div>
            <div>{loading ? <Skeleton className="h-7 w-14" /> : <p className="text-2xl font-bold text-secondary">{value}</p>}<p className="text-sm text-muted">{label}</p></div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-semibold text-secondary">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/students" className="btn-secondary"><List className="h-4 w-4" /> View Directory</Link>
          {isAdmin && <>
            <Link to="/students/new" className="btn-primary"><UserPlus className="h-4 w-4" /> Add New Student</Link>
            <Link to="/import" className="btn-secondary"><Upload className="h-4 w-4" /> Import Students</Link>
            <button className="btn-secondary" onClick={() => downloadFile('/students/export', {}, 'students-export.csv').catch((e) => toast('error', getError(e, 'Export failed').message))}><Download className="h-4 w-4" /> Export Students</button>
          </>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5"><h2 className="mb-4 font-semibold text-secondary">Department Distribution</h2>{loading ? <Skeleton className="h-40 w-full" /> : <Bars items={stats!.departmentDistribution} color="#2563EB" />}</div>
        <div className="card p-5"><h2 className="mb-4 font-semibold text-secondary">Academic Year Distribution</h2>{loading ? <Skeleton className="h-40 w-full" /> : <Bars items={stats!.yearDistribution} color="#0F172A" />}</div>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-secondary">Recently Added Students</h2><Link to="/students" className="text-sm text-primary hover:underline">View all</Link></div>
        {loading ? <Skeleton className="h-32 w-full" /> : recent.length === 0 ? <EmptyState title="No students yet" hint="Add your first student to get started." /> : (
          <ul className="divide-y divide-slate-100">
            {recent.map((s) => (
              <li key={s.id}><Link to={`/students/${s.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50">
                <Avatar name={s.fullName} /><div className="min-w-0 flex-1"><p className="truncate font-medium">{s.fullName}</p><p className="truncate text-sm text-muted">{s.rollNumber} · {s.department}</p></div><StatusBadge status={s.status} />
              </Link></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
