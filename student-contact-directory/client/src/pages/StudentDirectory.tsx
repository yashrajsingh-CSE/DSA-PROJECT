import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Eye, Pencil, Search, Trash2, UserPlus, X } from 'lucide-react';
import { api, downloadFile, getError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import Modal from '../components/common/Modal';
import { Avatar, EmptyState, ErrorState, Skeleton, StatusBadge } from '../components/common/ui';
import { Meta, Pagination, Student } from '../types';

const SORTS = [
  { key: 'createdAt', label: 'Date Added' }, { key: 'name', label: 'Student Name' }, { key: 'rollNumber', label: 'Roll Number' },
  { key: 'department', label: 'Department' }, { key: 'academicYear', label: 'Academic Year' },
];
const EMPTY = { department: '', academicYear: '', semester: '', section: '', status: '' };

export default function StudentDirectory() {
  const { isAdmin } = useAuth(); const { toast } = useToast();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [filters, setFilters] = useState(EMPTY);
  const [sortBy, setSortBy] = useState('createdAt'); const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1); const [limit, setLimit] = useState(10);
  const [rows, setRows] = useState<Student[]>([]); const [pg, setPg] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [meta, setMeta] = useState<Meta>({ departments: [], academicYears: [], semesters: [], sections: [] });
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState<Student | null>(null); const [deleting, setDeleting] = useState(false);
  const dq = useDebounce(q);

  useEffect(() => { setQ(params.get('q') || ''); }, [params]);
  const loadMeta = useCallback(() => api.get('/students/meta').then((r) => setMeta(r.data.data)).catch(() => {}), []);
  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { setPage(1); }, [dq, filters, sortBy, order, limit]);

  const query = { q: dq, ...filters, sortBy, order };
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await api.get('/students', { params: { ...query, page, limit } });
      setRows(r.data.data); setPg(r.data.pagination);
    } catch (e) { setError(getError(e, 'Failed to load students').message); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq, filters, sortBy, order, page, limit]);
  useEffect(() => { load(); }, [load]);

  const hasFilters = !!q || Object.values(filters).some(Boolean);
  const clear = () => { setQ(''); setFilters(EMPTY); };
  const setF = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLSelectElement>) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  const confirmDelete = async () => {
    if (!toDelete) return; setDeleting(true);
    try {
      await api.delete(`/students/${toDelete.id}`);
      toast('success', `${toDelete.fullName} was deleted`); setToDelete(null);
      if (rows.length === 1 && page > 1) setPage(page - 1); else load();
      loadMeta();
    } catch (e) { toast('error', getError(e, 'Delete failed').message); } finally { setDeleting(false); }
  };

  const pageNumbers = () => {
    const out: number[] = []; const s = Math.max(1, Math.min(pg.page - 2, pg.totalPages - 4)); const e = Math.min(pg.totalPages, s + 4);
    for (let i = s; i <= e; i++) out.push(i); return out;
  };

  const sel = (value: string, onChange: any, label: string, opts: (string | number)[]) => (
    <select className="input" value={value} onChange={onChange} aria-label={label}><option value="">{label}</option>{opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>
  );

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input className="input pl-9" placeholder="Search by name, roll number, email, mobile or department" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => downloadFile('/students/export', query, 'students-export.csv').then(() => toast('success', 'Export downloaded')).catch((e) => toast('error', getError(e, 'Export failed').message))}><Download className="h-4 w-4" /> Export{hasFilters ? ' filtered' : ''}</button>
              <Link to="/students/new" className="btn-primary"><UserPlus className="h-4 w-4" /> Add</Link>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
          {sel(filters.department, setF('department'), 'Department', meta.departments)}
          {sel(filters.academicYear, setF('academicYear'), 'Academic Year', meta.academicYears)}
          {sel(filters.semester, setF('semester'), 'Semester', meta.semesters)}
          {sel(filters.section, setF('section'), 'Section', meta.sections)}
          {sel(filters.status, setF('status'), 'Status', ['Active', 'Inactive'])}
          <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by">{SORTS.map((s) => <option key={s.key} value={s.key}>Sort: {s.label}</option>)}</select>
          <button className="btn-secondary" onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')} aria-label="Toggle sort order">{order === 'asc' ? <><ArrowUp className="h-4 w-4" /> Ascending</> : <><ArrowDown className="h-4 w-4" /> Descending</>}</button>
          <button className="btn-secondary" onClick={clear} disabled={!hasFilters}><X className="h-4 w-4" /> Clear filters</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {error ? <ErrorState message={error} onRetry={load} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
                <tr>{['Student Name', 'Roll Number', 'Email', 'Mobile Number', 'Department', 'Academic Year', 'Section', 'Status', 'Actions'].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? Array.from({ length: 6 }).map((_, i) => <tr key={i}><td colSpan={9} className="px-4 py-3"><Skeleton className="h-6 w-full" /></td></tr>) :
                  rows.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3"><Link to={`/students/${s.id}`} className="flex items-center gap-3 font-medium hover:text-primary"><Avatar name={s.fullName} />{s.fullName}</Link></td>
                      <td className="px-4 py-3">{s.rollNumber}</td>
                      <td className="px-4 py-3">{s.email}</td>
                      <td className="px-4 py-3">{s.mobileNumber}</td>
                      <td className="px-4 py-3">{s.department}</td>
                      <td className="px-4 py-3">{s.academicYear}</td>
                      <td className="px-4 py-3">{s.section || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Link to={`/students/${s.id}`} className="rounded p-1.5 text-muted hover:bg-slate-100 hover:text-primary" title="View details" aria-label="View details"><Eye className="h-4 w-4" /></Link>
                          {isAdmin && <>
                            <Link to={`/students/${s.id}/edit`} className="rounded p-1.5 text-muted hover:bg-slate-100 hover:text-primary" title="Edit" aria-label="Edit student"><Pencil className="h-4 w-4" /></Link>
                            <button onClick={() => setToDelete(s)} className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-danger" title="Delete" aria-label="Delete student"><Trash2 className="h-4 w-4" /></button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!loading && rows.length === 0 && <EmptyState title={hasFilters ? 'No students match your search' : 'No students yet'} hint={hasFilters ? 'Try different keywords or clear the filters.' : undefined}
              action={hasFilters ? <button className="btn-secondary" onClick={clear}>Clear filters</button> : isAdmin ? <Link to="/students/new" className="btn-primary">Add student</Link> : undefined} />}
          </div>
        )}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row">
          <div className="flex items-center gap-3 text-muted">
            <span>{pg.total} record{pg.total === 1 ? '' : 's'}</span>
            <label className="flex items-center gap-2">Per page
              <select className="input w-20 py-1" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>{[10, 25, 50, 100].map((n) => <option key={n}>{n}</option>)}</select></label>
          </div>
          <div className="flex items-center gap-1">
            <button className="btn-secondary px-2 py-1" disabled={pg.page <= 1} onClick={() => setPage(pg.page - 1)}><ChevronLeft className="h-4 w-4" /> Prev</button>
            {pageNumbers().map((n) => <button key={n} onClick={() => setPage(n)} className={`h-8 min-w-8 rounded-lg px-2 text-sm ${n === pg.page ? 'bg-primary text-white' : 'hover:bg-slate-100'}`}>{n}</button>)}
            <button className="btn-secondary px-2 py-1" disabled={pg.page >= pg.totalPages} onClick={() => setPage(pg.page + 1)}>Next <ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <Modal open={!!toDelete} title="Delete student?" onClose={() => !deleting && setToDelete(null)}>
        <p className="text-sm text-muted">You are about to permanently delete <strong className="text-ink">{toDelete?.fullName}</strong> ({toDelete?.rollNumber}). This cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setToDelete(null)} disabled={deleting}>Cancel</button>
          <button className="btn-danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
        </div>
      </Modal>
    </div>
  );
}
