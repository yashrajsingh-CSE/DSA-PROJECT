import { Router } from 'express';
import { db } from '../database/db';
import { requireAuth } from '../middleware/auth';
import { mapStudent } from './students';

const router = Router();
router.use(requireAuth);

router.get('/stats', (_req, res) => {
  const one = (sql: string) => (db.prepare(sql).get() as any).c as number;
  res.json({
    success: true,
    data: {
      totalStudents: one('SELECT COUNT(*) c FROM students'),
      totalDepartments: one('SELECT COUNT(DISTINCT department) c FROM students'),
      activeStudents: one("SELECT COUNT(*) c FROM students WHERE status='Active'"),
      inactiveStudents: one("SELECT COUNT(*) c FROM students WHERE status='Inactive'"),
      departmentDistribution: db.prepare('SELECT department label, COUNT(*) count FROM students GROUP BY department ORDER BY count DESC').all(),
      yearDistribution: db.prepare('SELECT academic_year label, COUNT(*) count FROM students GROUP BY academic_year ORDER BY academic_year').all(),
    },
  });
});

router.get('/recent-students', (_req, res) => {
  const rows = db.prepare('SELECT * FROM students ORDER BY created_at DESC, id DESC LIMIT 5').all();
  res.json({ success: true, data: rows.map(mapStudent) });
});

export default router;
