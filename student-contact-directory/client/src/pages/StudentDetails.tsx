import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Pencil, Phone, Trash2 } from 'lucide-react';
import { api, getError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/common/Modal';
import { Avatar, ErrorState, Spinner, StatusBadge } from '../components/common/ui';
import { Student } from '../types';

const fmt = (d: string) => new Date(d.replace(' ', 'T') + 'Z').toLocaleString();

export default function StudentDetails() {
  const { id } = useParams(); const nav = useNavigate();
  const { isAdmin } = useAuth(); const { toast } = useToast();
  const [s, setS] = useState<Student | null>(null); const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false);

  useEffect(() => { api.get(`/students/${id}`).then((r) => setS(r.data.data)).catch((e) => setError(getError(e, 'Student not found').message)); }, [id]);

  const del = async () => {
    setBusy(true);
    try { await api.delete(`/students/${id}`); toast('success', 'Student deleted'); nav('/students'); }
    catch (e) { toast('error', getError(e, 'Delete failed').message); setBusy(false); }
  };

  if (error) return <div className="card"><ErrorState message={error} /><div className="pb-6 text-center"><Link to="/students" className="btn-secondary">Back to Directory</Link></div></div>;
  if (!s) return <Spinner />;

  const rows: [string, string | number][] = [
    ['Student ID', s.id], ['Roll Number', s.rollNumber], ['Email Address', s.email], ['Mobile Number', s.mobileNumber],
    ['Department', s.department], ['Course', s.course], ['Academic Year', s.academicYear], ['Semester', s.semester ?? '—'],
    ['Section', s.section || '—'], ['Batch', s.batch || '—'], ['Date Added', fmt(s.createdAt)], ['Last Updated', fmt(s.updatedAt)],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/students" className="btn-secondary"><ArrowLeft className="h-4 w-4" /> Back to Directory</Link>
      <div className="card overflow-hidden">
        <div className="flex flex-col items-center gap-4 border-b border-slate-100 p-6 sm:flex-row">
          <Avatar name={s.fullName} size="lg" />
          <div className="flex-1 text-center sm:text-left"><h2 className="text-xl font-semibold text-secondary">{s.fullName}</h2><p className="text-muted">{s.course} · {s.department}</p><div className="mt-2"><StatusBadge status={s.status} /></div></div>
          <div className="flex flex-wrap justify-center gap-2">
            <a href={`mailto:${s.email}`} className="btn-secondary"><Mail className="h-4 w-4" /> Email</a>
            <a href={`tel:${s.mobileNumber}`} className="btn-secondary"><Phone className="h-4 w-4" /> Call</a>
          </div>
        </div>
        <dl className="grid gap-x-6 gap-y-4 p-6 sm:grid-cols-2">
          {rows.map(([k, v]) => <div key={k}><dt className="text-xs uppercase tracking-wide text-muted">{k}</dt><dd className="mt-0.5 break-words font-medium">{v}</dd></div>)}
        </dl>
        {isAdmin && (
          <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
            <Link to={`/students/${s.id}/edit`} className="btn-primary"><Pencil className="h-4 w-4" /> Edit</Link>
            <button className="btn-danger" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /> Delete</button>
          </div>
        )}
      </div>
      <Modal open={confirm} title="Delete student?" onClose={() => !busy && setConfirm(false)}>
        <p className="text-sm text-muted">Permanently delete <strong className="text-ink">{s.fullName}</strong> ({s.rollNumber})? This cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setConfirm(false)} disabled={busy}>Cancel</button><button className="btn-danger" onClick={del} disabled={busy}>{busy ? 'Deleting...' : 'Delete'}</button></div>
      </Modal>
    </div>
  );
}
