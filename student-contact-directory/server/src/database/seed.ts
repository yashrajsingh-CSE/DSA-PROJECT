// Inserts FICTIONAL sample students. Safe to re-run (INSERT OR IGNORE).
import { db, initDatabase } from './db';
initDatabase();

const first = ['Aarav', 'Diya', 'Vivaan', 'Anaya', 'Reyansh', 'Isha', 'Kabir', 'Meera', 'Arjun', 'Saanvi', 'Rohan', 'Tara', 'Dev', 'Nisha', 'Karan'];
const last = ['Sharma', 'Verma', 'Patel', 'Singh', 'Gupta', 'Nair', 'Reddy', 'Mishra', 'Das', 'Joshi'];
const depts: [string, string, string][] = [
  ['Computer Science', 'B.Tech CSE', 'CS'], ['Information Technology', 'B.Tech IT', 'IT'],
  ['Electronics', 'B.Tech ECE', 'EC'], ['Mechanical', 'B.Tech ME', 'ME'], ['Business Administration', 'BBA', 'BA'],
];
const years = ['2023-24', '2024-25', '2025-26', '2026-27'];
const stmt = db.prepare(`INSERT OR IGNORE INTO students (full_name,roll_number,email,mobile_number,department,course,academic_year,semester,section,batch,status)
  VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
let n = 0;
db.transaction(() => {
  for (let i = 0; i < 48; i++) {
    const [dept, course, code] = depts[i % depts.length];
    const yi = i % years.length;
    const name = `${first[i % first.length]} ${last[(i * 3) % last.length]}`;
    const roll = `${code}${2023 + yi}${String(i + 1).padStart(3, '0')}`;
    const sem = Math.min(8, (3 - yi) * 2 + 1);
    const info = stmt.run(name, roll, `${name.toLowerCase().replace(' ', '.')}.${i + 1}@example.edu`, `98${String(10000000 + i * 7919).slice(0, 8)}`,
      dept, course, years[yi], sem, ['A', 'B', 'C'][i % 3], `${2023 + yi}-${2027 + yi}`, i % 9 === 0 ? 'Inactive' : 'Active');
    n += info.changes;
  }
})();
console.log(`Seeded ${n} sample students.`);
