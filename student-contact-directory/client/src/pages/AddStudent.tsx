import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getError } from '../services/api';
import { useToast } from '../context/ToastContext';
import StudentFormFields, { emptyForm } from '../components/students/StudentFormFields';
import { ErrorState, Spinner } from '../components/common/ui';
import { StudentForm } from '../types';

export default function AddStudent() {
  const { id } = useParams(); const editing = !!id;
  const nav = useNavigate(); const { toast } = useToast();
  const [initial, setInitial] = useState<StudentForm | null>(editing ? null : emptyForm);
  const [loadError, setLoadError] = useState('');
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(`/students/${id}`).then((r) => {
      const s = r.data.data;
      setInitial({ fullName: s.fullName, rollNumber: s.rollNumber, email: s.email, mobileNumber: s.mobileNumber, department: s.department, course: s.course, academicYear: s.academicYear, semester: s.semester == null ? '' : String(s.semester), section: s.section, batch: s.batch, status: s.status });
    }).catch((e) => setLoadError(getError(e, 'Student not found').message));
  }, [id, editing]);

  const submit = async (f: StudentForm) => {
    setSubmitting(true); setServerErrors({});
    try {
      if (editing) { await api.put(`/students/${id}`, f); toast('success', 'Student updated successfully'); nav(`/students/${id}`); }
      else { await api.post('/students', f); toast('success', 'Student added successfully'); nav('/students'); }
    } catch (e) {
      const { message, fields } = getError(e, 'Could not save student');
      setServerErrors(fields); toast('error', Object.keys(fields).length ? 'Please fix the highlighted fields' : message);
    } finally { setSubmitting(false); }
  };

  if (loadError) return <div className="card"><ErrorState message={loadError} /></div>;
  if (!initial) return <Spinner />;
  return (
    <div className="mx-auto max-w-3xl">
      <StudentFormFields initial={initial} serverErrors={serverErrors} submitting={submitting} submitLabel={editing ? 'Save changes' : 'Add student'} onSubmit={submit} onCancel={() => nav(editing ? `/students/${id}` : '/students')} />
    </div>
  );
}
