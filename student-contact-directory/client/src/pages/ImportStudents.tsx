import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Download, FileUp, Loader2, XCircle } from 'lucide-react';
import { api, downloadFile, getError } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Preview { total: number; validCount: number; invalidCount: number; imported: number; committed: boolean; valid: any[]; invalid: { row: number; data: any; errors: Record<string, string> }[]; }

export default function ImportStudents() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [csv, setCsv] = useState(''); const [name, setName] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);

  const onFile = async (file?: File) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) return toast('error', 'Please choose a .csv file');
    const text = await file.text();
    setCsv(text); setName(file.name); setDone(false); setPreview(null); setBusy(true);
    try { const r = await api.post('/students/import', { csv: text, commit: false }); setPreview(r.data.data); }
    catch (e) { toast('error', getError(e, 'Could not read CSV').message); } finally { setBusy(false); }
  };

  const commit = async () => {
    setBusy(true);
    try {
      const r = await api.post('/students/import', { csv, commit: true });
      setPreview(r.data.data); setDone(true); toast('success', `${r.data.data.imported} student(s) imported`);
    } catch (e) { toast('error', getError(e, 'Import failed').message); } finally { setBusy(false); }
  };

  const reset = () => { setCsv(''); setName(''); setPreview(null); setDone(false); if (fileRef.current) fileRef.current.value = ''; };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-semibold text-secondary">Import students from CSV</h2><p className="text-sm text-muted">Required columns: Full Name, Roll Number, Email, Mobile Number, Department, Course, Academic Year. Optional: Semester, Section, Batch, Status.</p></div>
        <button className="btn-secondary shrink-0" onClick={() => downloadFile('/students/template', {}, 'student-import-template.csv').catch((e) => toast('error', getError(e).message))}><Download className="h-4 w-4" /> Download template</button>
      </div>

      <label className="card flex cursor-pointer flex-col items-center gap-2 border-2 border-dashed p-8 text-center hover:border-primary">
        <FileUp className="h-8 w-8 text-primary" />
        <span className="font-medium">{name || 'Choose a CSV file'}</span>
        <span className="text-sm text-muted">Click to browse (max 5000 rows)</span>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>

      {busy && !preview && <div className="flex items-center justify-center gap-2 py-6 text-muted"><Loader2 className="h-5 w-5 animate-spin" /> Validating...</div>}

      {preview && (
        <div className="card space-y-4 p-5">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-lg bg-slate-100 px-3 py-1.5">Rows: <b>{preview.total}</b></span>
            <span className="rounded-lg bg-green-50 px-3 py-1.5 text-green-700">{done ? 'Imported' : 'Valid'}: <b>{done ? preview.imported : preview.validCount}</b></span>
            <span className="rounded-lg bg-red-50 px-3 py-1.5 text-danger">Rejected: <b>{done ? preview.invalidCount : preview.invalidCount}</b></span>
          </div>

          {preview.valid.length > 0 && !done && (
            <div><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-success" /> Preview of valid records{preview.validCount > preview.valid.length && ` (first ${preview.valid.length})`}</h3>
              <div className="max-h-64 overflow-auto rounded-lg border border-slate-200"><table className="w-full min-w-[640px] text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-muted"><tr>{['Name', 'Roll No.', 'Email', 'Mobile', 'Department', 'Year'].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">{preview.valid.map((v, i) => <tr key={i}><td className="px-3 py-2">{v.fullName}</td><td className="px-3 py-2">{v.rollNumber}</td><td className="px-3 py-2">{v.email}</td><td className="px-3 py-2">{v.mobileNumber}</td><td className="px-3 py-2">{v.department}</td><td className="px-3 py-2">{v.academicYear}</td></tr>)}</tbody></table></div></div>
          )}

          {preview.invalid.length > 0 && (
            <div><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><XCircle className="h-4 w-4 text-danger" /> Rejected records</h3>
              <div className="max-h-64 overflow-auto rounded-lg border border-red-200"><table className="w-full min-w-[560px] text-left text-sm">
                <thead className="sticky top-0 bg-red-50 text-xs uppercase text-danger"><tr><th className="px-3 py-2">CSV row</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Roll No.</th><th className="px-3 py-2">Errors</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{preview.invalid.map((r) => <tr key={r.row}><td className="px-3 py-2">{r.row}</td><td className="px-3 py-2">{r.data.fullName || '—'}</td><td className="px-3 py-2">{r.data.rollNumber || '—'}</td><td className="px-3 py-2 text-danger">{Object.values(r.errors).join('; ')}</td></tr>)}</tbody></table></div></div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            {done ? <><button className="btn-secondary" onClick={reset}>Import another file</button><Link to="/students" className="btn-primary">View directory</Link></> : <>
              <button className="btn-secondary" onClick={reset} disabled={busy}>Cancel</button>
              <button className="btn-primary" onClick={commit} disabled={busy || preview.validCount === 0}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Import {preview.validCount} valid record{preview.validCount === 1 ? '' : 's'}</button></>}
          </div>
        </div>
      )}
    </div>
  );
}
