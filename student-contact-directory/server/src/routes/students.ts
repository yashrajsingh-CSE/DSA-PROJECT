import { Router, Request } from 'express';
import { parse } from 'csv-parse/sync';
import { db } from '../database/db';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { normalizeStudent, validateStudent, StudentInput, Errors } from '../validators/student';

const router = Router();
router.use(requireAuth);

export function mapStudent(r: any) {
  return {
    id: r.id, fullName: r.full_name, rollNumber: r.roll_number, email: r.email, mobileNumber: r.mobile_number,
    department: r.department, course: r.course, academicYear: r.academic_year, semester: r.semester,
    section: r.section || '', batch: r.batch || '', status: r.status, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

const SORT: Record<string, string> = {
  name: 'full_name', rollNumber: 'roll_number', department: 'department', academicYear: 'academic_year', createdAt: 'created_at',
};
const CSV_HEADERS = ['Full Name', 'Roll Number', 'Email', 'Mobile Number', 'Department', 'Course', 'Academic Year', 'Semester', 'Section', 'Batch', 'Status'];

function buildQuery(q: Request['query']) {
  const where: string[] = []; const params: any[] = [];
  const text = String(q.q || '').trim();
  if (text) {
    const like = `%${text.replace(/[!%_]/g, (m) => '!' + m)}%`;
    where.push("(full_name LIKE ? ESCAPE '!' OR roll_number LIKE ? ESCAPE '!' OR email LIKE ? ESCAPE '!' OR mobile_number LIKE ? ESCAPE '!' OR department LIKE ? ESCAPE '!')");
    params.push(like, like, like, like, like);
  }
  const eq = (key: string, col: string) => { const v = String(q[key] || '').trim(); if (v) { where.push(`${col} = ?`); params.push(v); } };
  eq('department', 'department'); eq('academicYear', 'academic_year'); eq('semester', 'semester'); eq('section', 'section'); eq('status', 'status');
  const col = SORT[String(q.sortBy)] || 'created_at';
  const dir = String(q.order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return { clause: where.length ? 'WHERE ' + where.join(' AND ') : '', params, orderBy: `ORDER BY ${col} ${dir}, id ${dir}` };
}

function csvCell(v: unknown) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const toCsv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';

function findDuplicates(d: StudentInput, excludeId?: number): Errors {
  const e: Errors = {};
  const ex = excludeId ?? -1;
  if (db.prepare('SELECT 1 FROM students WHERE roll_number = ? AND id != ?').get(d.rollNumber, ex)) e.rollNumber = 'This roll number already exists';
  if (db.prepare('SELECT 1 FROM students WHERE email = ? AND id != ?').get(d.email, ex)) e.email = 'This email address already exists';
  return e;
}

const INSERT_SQL = `INSERT INTO students (full_name,roll_number,email,mobile_number,department,course,academic_year,semester,section,batch,status)
  VALUES (@fullName,@rollNumber,@email,@mobileNumber,@department,@course,@academicYear,@semester,@section,@batch,@status)`;

// ---- static routes first ----
router.get('/meta', (_req, res) => {
  const list = (c: string) => (db.prepare(`SELECT DISTINCT ${c} v FROM students WHERE ${c} IS NOT NULL AND ${c} != '' ORDER BY ${c}`).all() as any[]).map((r) => r.v);
  res.json({ success: true, data: { departments: list('department'), academicYears: list('academic_year'), semesters: list('semester'), sections: list('section') } });
});

router.get('/template', requireAdmin, (_req, res) => {
  const sample = ['Aarav Sharma', 'CS2026001', 'aarav.sharma@example.edu', '9876543210', 'Computer Science', 'B.Tech', '2026-27', '3', 'A', '2024-2028', 'Active'];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="student-import-template.csv"');
  res.send(toCsv([CSV_HEADERS, sample]));
});

router.get('/export', requireAdmin, (req, res) => {
  const { clause, params, orderBy } = buildQuery(req.query);
  const rows = db.prepare(`SELECT * FROM students ${clause} ${orderBy}`).all(...params) as any[];
  const body = rows.map((r) => [r.full_name, r.roll_number, r.email, r.mobile_number, r.department, r.course, r.academic_year, r.semester, r.section, r.batch, r.status]);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="students-export.csv"');
  res.send('\uFEFF' + toCsv([CSV_HEADERS, ...body]));
});

router.post('/import', requireAdmin, (req, res) => {
  const csv = String(req.body?.csv || '');
  const commit = req.body?.commit === true;
  if (!csv.trim()) return res.status(400).json({ success: false, message: 'CSV content is empty' });
  let records: Record<string, string>[];
  try {
    records = parse(csv, { columns: (h: string[]) => h.map((x) => x.replace(/^\uFEFF/, '').toLowerCase().replace(/[^a-z0-9]/g, '')), skip_empty_lines: true, trim: true, relax_column_count: true });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: 'Could not parse CSV: ' + err.message });
  }
  if (records.length === 0) return res.status(400).json({ success: false, message: 'CSV contains no data rows' });
  if (records.length > 5000) return res.status(400).json({ success: false, message: 'Maximum 5000 rows per import' });

  const seenRoll = new Set<string>(); const seenEmail = new Set<string>();
  const valid: StudentInput[] = []; const invalid: { row: number; data: any; errors: Errors }[] = [];
  records.forEach((r, i) => {
    const d = normalizeStudent({
      fullName: r.fullname || r.name, rollNumber: r.rollnumber || r.rollno, email: r.email || r.emailaddress,
      mobileNumber: r.mobilenumber || r.mobile || r.phone, department: r.department, course: r.course || r.courseprogram || r.program,
      academicYear: r.academicyear || r.year, semester: r.semester, section: r.section, batch: r.batch, status: r.status,
    });
    const errors = { ...validateStudent(d) };
    if (!errors.rollNumber && seenRoll.has(d.rollNumber.toLowerCase())) errors.rollNumber = 'Duplicate roll number within file';
    if (!errors.email && seenEmail.has(d.email)) errors.email = 'Duplicate email within file';
    Object.assign(errors, Object.fromEntries(Object.entries(findDuplicates(d)).filter(([k]) => !errors[k])));
    seenRoll.add(d.rollNumber.toLowerCase()); seenEmail.add(d.email);
    if (Object.keys(errors).length) invalid.push({ row: i + 2, data: d, errors }); else valid.push(d);
  });

  let imported = 0;
  if (commit && valid.length) {
    const stmt = db.prepare(INSERT_SQL);
    db.transaction(() => { for (const d of valid) { stmt.run(d); imported++; } })();
  }
  res.json({ success: true, data: { total: records.length, validCount: valid.length, invalidCount: invalid.length, imported, committed: commit, valid: valid.slice(0, 100), invalid } });
});

// ---- list / CRUD ----
router.get('/', (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page)) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit)) || 10));
  const { clause, params, orderBy } = buildQuery(req.query);
  const total = (db.prepare(`SELECT COUNT(*) c FROM students ${clause}`).get(...params) as any).c as number;
  const rows = db.prepare(`SELECT * FROM students ${clause} ${orderBy} LIMIT ? OFFSET ?`).all(...params, limit, (page - 1) * limit);
  res.json({ success: true, data: rows.map(mapStudent), pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM students WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, data: mapStudent(row) });
});

router.post('/', requireAdmin, (req, res) => {
  const d = normalizeStudent(req.body);
  const errors = validateStudent(d);
  if (Object.keys(errors).length) return res.status(400).json({ success: false, message: 'Validation failed', errors });
  const dup = findDuplicates(d);
  if (Object.keys(dup).length) return res.status(409).json({ success: false, message: 'Duplicate record', errors: dup });
  const info = db.prepare(INSERT_SQL).run(d);
  res.status(201).json({ success: true, data: mapStudent(db.prepare('SELECT * FROM students WHERE id = ?').get(info.lastInsertRowid)) });
});

router.put('/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT 1 FROM students WHERE id = ?').get(id)) return res.status(404).json({ success: false, message: 'Student not found' });
  const d = normalizeStudent(req.body);
  const errors = validateStudent(d);
  if (Object.keys(errors).length) return res.status(400).json({ success: false, message: 'Validation failed', errors });
  const dup = findDuplicates(d, id);
  if (Object.keys(dup).length) return res.status(409).json({ success: false, message: 'Duplicate record', errors: dup });
  db.prepare(`UPDATE students SET full_name=@fullName, roll_number=@rollNumber, email=@email, mobile_number=@mobileNumber,
    department=@department, course=@course, academic_year=@academicYear, semester=@semester, section=@section, batch=@batch,
    status=@status, updated_at=datetime('now') WHERE id=@id`).run({ ...d, id });
  res.json({ success: true, data: mapStudent(db.prepare('SELECT * FROM students WHERE id = ?').get(id)) });
});

router.delete('/:id', requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM students WHERE id = ?').run(Number(req.params.id));
  if (!info.changes) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, message: 'Student deleted' });
});

export default router;
