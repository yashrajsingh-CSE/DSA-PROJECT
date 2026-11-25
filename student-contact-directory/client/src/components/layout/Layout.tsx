import { useState, FormEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { GraduationCap, LayoutDashboard, Users, UserPlus, Upload, Settings as Cog, LogOut, Menu, X, Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TITLES: Record<string, string> = { '/': 'Dashboard', '/students': 'Student Directory', '/students/new': 'Add Student', '/import': 'Import Students', '/settings': 'Settings' };

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const loc = useLocation();
  const nav = useNavigate();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/students', label: 'Student Directory', icon: Users, end: true },
    ...(isAdmin ? [{ to: '/students/new', label: 'Add Student', icon: UserPlus, end: true }, { to: '/import', label: 'Import Students', icon: Upload, end: true }] : []),
    { to: '/settings', label: 'Settings', icon: Cog, end: true },
  ];
  const path = loc.pathname;
  const title = TITLES[path] || (path.endsWith('/edit') ? 'Edit Student' : path.startsWith('/students/') ? 'Student Details' : 'Student Contact Directory');
  const crumbs = path === '/' ? [] : [{ label: 'Directory', to: '/students' }].filter(() => path.startsWith('/students/')).concat();

  const submitSearch = (e: FormEvent) => { e.preventDefault(); nav(`/students?q=${encodeURIComponent(q.trim())}`); setQ(''); };

  const sidebar = (
    <div className="flex h-full flex-col bg-secondary text-slate-300">
      <div className="flex items-center gap-2 px-5 py-5 text-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary"><GraduationCap className="h-5 w-5" /></div>
        <span className="font-semibold leading-tight">Student Contact<br />Directory</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'hover:bg-white/10 hover:text-white'}`}>
            <Icon className="h-4 w-4" /> {label}
          </NavLink>
        ))}
      </nav>
      <button onClick={logout} className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10 hover:text-white"><LogOut className="h-4 w-4" /> Logout</button>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64">{sidebar}<button className="absolute right-2 top-4 text-white" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button></div>
        </div>
      )}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
        <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-6 w-6" /></button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-secondary">{title}</h1>
          <div className="flex items-center gap-1 text-xs text-muted">
            <Link to="/" className="hover:text-primary">Home</Link>
            {crumbs.map((c) => <span key={c.to} className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /><Link to={c.to} className="hover:text-primary">{c.label}</Link></span>)}
            {path !== '/' && <><ChevronRight className="h-3 w-3" /><span>{title}</span></>}
          </div>
        </div>
        <form onSubmit={submitSearch} className="relative hidden md:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input className="input w-64 pl-9" placeholder="Search students..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
        </form>
        <Link to="/students" className="md:hidden" aria-label="Search"><Search className="h-5 w-5" /></Link>
        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block"><p className="text-sm font-medium leading-tight">{user?.name}</p><p className="text-xs text-muted">{user?.email}</p></div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${isAdmin ? 'bg-primary-light text-primary' : 'bg-slate-100 text-slate-600'}`}>{user?.role}</span>
        </div>
      </header>
      <main className="p-4 sm:p-6"><Outlet /></main>
    </div>
  );
}
