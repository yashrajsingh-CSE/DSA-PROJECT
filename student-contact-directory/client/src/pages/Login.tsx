import { FormEvent, useState } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getError } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await login(email, password); } catch (err) { setError(getError(err, 'Unable to sign in').message); } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-primary-dark p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white"><GraduationCap className="h-6 w-6" /></div>
          <h1 className="text-xl font-semibold text-secondary">Student Contact Directory</h1>
          <p className="text-sm text-muted">Sign in to continue</p>
        </div>
        {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-danger">{error}</div>}
        <div><label className="mb-1 block text-sm font-medium" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></div>
        <div><label className="mb-1 block text-sm font-medium" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in</button>
      </form>
    </div>
  );
}
