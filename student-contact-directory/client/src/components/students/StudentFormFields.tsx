import { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { StudentForm } from '../../types';

export const emptyForm: StudentForm = {
  fullName: '', rollNumber: '', email: '', mobileNumber: '', department: '', course: '', academicYear: '',
  semester: '', section: '', batch: '', status: 'Active',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^\+?[0-9][0-9\s\-]{6,14}$/;

function validate(f: StudentForm) {
  const e: Record<string, string> = {};
  if (!f.fullName.trim()) e.fullName = 'Full name is required';
  if (!f.rollNumber.trim()) e.rollNumber = 'Roll number is required';
  if (!f.email.trim()) e.email = 'Email is required'; else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address';
  if (!f.mobileNumber.trim()) e.mobileNumber = 'Mobile number is required'; else if (!MOBILE_RE.test(f.mobileNumber.trim())) e.mobileNumber = 'Enter a valid mobile number (7-15 digits)';
  if (!f.department.trim()) e.department = 'Department is required';
  if (!f.course.trim()) e.course = 'Course/Program is required';
  if (!f.academicYear.trim()) e.academicYear = 'Academic year is required';
  if (f.semester && (!/^\d+$/.test(f.semester) || +f.semester < 1 || +f.semester > 12)) e.semester = 'Semester must be between 1 and 12';
  return e;
}

interface Props { initial: StudentForm; serverErrors: Record<string, string>; submitting: boolean; submitLabel: string; onSubmit: (f: StudentForm) => void; onCancel: () => void; }

export default function StudentFormFields({ initial, serverErrors, submitting, submitLabel, onSubmit, onCancel }: Props) {
  const [f, setF] = useState<StudentForm>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const all = { ...serverErrors, ...errors };
  const set = (k: keyof StudentForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setF({ ...f, [k]: e.target.value } as StudentForm); if (errors[k]) setErrors({ ...errors, [k]: '' }); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = validate(f); setErrors(v);
    if (Object.keys(v).length === 0) onSubmit(f);
  };

  const field = (k: keyof StudentForm, label: string, opts: { required?: boolean; type?: string; placeholder?: string } = {}) => (
    <div>
      <label htmlFor={k} className="mb-1 block text-sm font-medium">{label}{opts.required && <span className="text-danger"> *</span>}</label>
      <input id={k} type={opts.type || 'text'} className={`input ${all[k] ? 'input-error' : ''}`} value={f[k]} onChange={set(k)} placeholder={opts.placeholder} aria-invalid={!!all[k]} />
      {all[k] && <p className="mt-1 text-xs text-danger">{all[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="card space-y-5 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {field('fullName', 'Full Name', { required: true, placeholder: 'e.g. Aarav Sharma' })}
        {field('rollNumber', 'Roll Number', { required: true, placeholder: 'e.g. CS2026001' })}
        {field('email', 'Email Address', { required: true, type: 'email', placeholder: 'name@college.edu' })}
        {field('mobileNumber', 'Mobile Number', { required: true, type: 'tel', placeholder: '9876543210' })}
        {field('department', 'Department', { required: true, placeholder: 'e.g. Computer Science' })}
        {field('course', 'Course / Program', { required: true, placeholder: 'e.g. B.Tech CSE' })}
        {field('academicYear', 'Academic Year', { required: true, placeholder: 'e.g. 2026-27' })}
        {field('semester', 'Semester', { type: 'number', placeholder: '1-12' })}
        {field('section', 'Section', { placeholder: 'e.g. A' })}
        {field('batch', 'Batch', { placeholder: 'e.g. 2024-2028' })}
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">Status</label>
          <select id="status" className="input" value={f.status} onChange={set('status')}><option>Active</option><option>Inactive</option></select>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button className="btn-primary" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />} {submitLabel}</button>
      </div>
    </form>
  );
}
