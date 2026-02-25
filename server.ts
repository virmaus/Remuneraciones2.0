
import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { networkInterfaces } from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('remunpro.db');

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, rut TEXT, name TEXT, address TEXT, activityCode TEXT);
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY, companyId TEXT, rut TEXT, firstName TEXT, lastName TEXT, email TEXT, 
    baseSalary REAL, position TEXT, costCenterId TEXT, startDate TEXT, contractType TEXT, 
    contractSubtype TEXT, jornada INTEGER, afpName TEXT, afpCode TEXT, healthName TEXT, 
    healthCode TEXT, isActive INTEGER, vacationDaysRemaining REAL, syncStatus TEXT,
    absenteeismDays INTEGER, medicalLeaveDays INTEGER, unpaidLeaveDays INTEGER
  );
  CREATE TABLE IF NOT EXISTS payroll_results (
    id TEXT PRIMARY KEY, employeeId TEXT, month INTEGER, year INTEGER, grossSalary REAL, 
    taxableSalary REAL, legalGratification REAL, afpAmount REAL, healthAmount REAL, 
    taxAmount REAL, loanDeduction REAL, netSalary REAL, costCenterId TEXT, bonuses REAL, discounts REAL,
    absenteeismDays REAL, medicalLeaveDays REAL, unpaidLeaveDays REAL, version INTEGER, audit TEXT
  );
  CREATE TABLE IF NOT EXISTS monthly_parameters (
    id TEXT PRIMARY KEY, year INTEGER, month INTEGER, uf REAL, utm REAL, imm REAL, sis REAL, 
    isClosed INTEGER, lastFolio INTEGER
  );
  CREATE TABLE IF NOT EXISTS vacations (id TEXT PRIMARY KEY, workerId TEXT, startDate TEXT, endDate TEXT, daysTaken REAL, status TEXT);
  CREATE TABLE IF NOT EXISTS finiquitos (id TEXT PRIMARY KEY, employeeId TEXT, terminationDate TEXT, cause TEXT, totalAmount REAL, yearsOfServiceIndemnity REAL, vacationIndemnity REAL, noticeIndemnity REAL);
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT, fullName TEXT, roleId TEXT, isActive INTEGER, lastLogin TEXT);
  CREATE TABLE IF NOT EXISTS user_roles (id TEXT PRIMARY KEY, name TEXT, permissions TEXT);
  CREATE TABLE IF NOT EXISTS monthly_movements (
    id TEXT PRIMARY KEY, employeeId TEXT, companyId TEXT, month INTEGER, year INTEGER, 
    type TEXT, description TEXT, amount REAL, unit TEXT, date TEXT
  );
`);

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/companies', (req, res) => {
    const rows = db.prepare('SELECT * FROM companies').all();
    res.json(rows);
  });

  app.post('/api/companies', (req, res) => {
    const { id, rut, name, address, activityCode } = req.body;
    db.prepare('INSERT OR REPLACE INTO companies VALUES (?,?,?,?,?)').run(id, rut, name, address, activityCode);
    res.json({ success: true });
  });

  app.get('/api/employees/:companyId', (req, res) => {
    const rows = db.prepare('SELECT * FROM employees WHERE companyId = ?').all(req.params.companyId);
    res.json(rows.map((r: any) => ({ ...r, isActive: r.isActive === 1 })));
  });

  app.post('/api/employees', (req, res) => {
    const e = req.body;
    db.prepare(`
      INSERT OR REPLACE INTO employees VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      e.id, e.companyId, e.rut, e.firstName, e.lastName, e.email || null, 
      e.baseSalary, e.position, e.costCenterId, e.startDate, e.contractType, 
      e.contractSubtype || null, e.jornada, e.afpName, e.afpCode || null, 
      e.healthName, e.healthCode || null, e.isActive ? 1 : 0, e.vacationDaysRemaining, 
      e.syncStatus, e.absenteeismDays || 0, e.medicalLeaveDays || 0, e.unpaidLeaveDays || 0
    );
    res.json({ success: true });
  });

  app.get('/api/payroll/:month/:year', (req, res) => {
    const rows = db.prepare('SELECT * FROM payroll_results WHERE month = ? AND year = ?').all(req.params.month, req.params.year);
    res.json(rows.map((r: any) => ({ ...r, audit: r.audit ? JSON.parse(r.audit) : null })));
  });

  app.post('/api/payroll', (req, res) => {
    const r = req.body;
    db.prepare(`
      INSERT OR REPLACE INTO payroll_results VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      r.id, r.employeeId, r.month, r.year, r.grossSalary, r.taxableSalary, r.legalGratification,
      r.afpAmount, r.healthAmount, r.taxAmount, r.loanDeduction, r.netSalary, r.costCenterId,
      r.bonuses, r.discounts, r.absenteeismDays, r.medicalLeaveDays, r.unpaidLeaveDays,
      r.version, r.audit ? JSON.stringify(r.audit) : null
    );
    res.json({ success: true });
  });

  app.get('/api/parameters/:month/:year', (req, res) => {
    const row = db.prepare('SELECT * FROM monthly_parameters WHERE month = ? AND year = ?').get(req.params.month, req.params.year);
    if (row) {
      res.json({ ...row as any, isClosed: (row as any).isClosed === 1 });
    } else {
      res.json(null);
    }
  });

  app.post('/api/parameters', (req, res) => {
    const p = req.body;
    db.prepare(`
      INSERT OR REPLACE INTO monthly_parameters VALUES (?,?,?,?,?,?,?,?,?)
    `).run(p.id, p.year, p.month, p.uf, p.utm, p.imm, p.sis, p.isClosed ? 1 : 0, p.lastFolio || 0);
    res.json({ success: true });
  });

  app.get('/api/movements/:companyId/:month/:year', (req, res) => {
    const rows = db.prepare('SELECT * FROM monthly_movements WHERE companyId = ? AND month = ? AND year = ?').all(req.params.companyId, req.params.month, req.params.year);
    res.json(rows);
  });

  app.post('/api/movements', (req, res) => {
    const m = req.body;
    db.prepare(`
      INSERT OR REPLACE INTO monthly_movements VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(m.id, m.employeeId, m.companyId, m.month, m.year, m.type, m.description, m.amount, m.unit, m.date);
    res.json({ success: true });
  });

  app.get('/api/vacations', (req, res) => {
    const rows = db.prepare('SELECT * FROM vacations').all();
    res.json(rows);
  });

  app.post('/api/vacations', (req, res) => {
    const v = req.body;
    db.prepare('INSERT OR REPLACE INTO vacations VALUES (?,?,?,?,?,?)').run(v.id, v.workerId, v.startDate, v.endDate, v.daysTaken, v.status);
    res.json({ success: true });
  });

  app.get('/api/finiquitos', (req, res) => {
    const rows = db.prepare('SELECT * FROM finiquitos').all();
    res.json(rows);
  });

  app.post('/api/finiquitos', (req, res) => {
    const f = req.body;
    db.prepare('INSERT OR REPLACE INTO finiquitos VALUES (?,?,?,?,?,?,?,?)').run(f.id, f.employeeId, f.terminationDate, f.cause, f.totalAmount, f.yearsOfServiceIndemnity, f.vacationIndemnity, f.noticeIndemnity);
    res.json({ success: true });
  });

  app.get('/api/users', (req, res) => {
    const rows = db.prepare('SELECT * FROM users').all();
    res.json(rows.map((r: any) => ({ ...r, isActive: r.isActive === 1 })));
  });

  app.post('/api/users', (req, res) => {
    const u = req.body;
    db.prepare('INSERT OR REPLACE INTO users VALUES (?,?,?,?,?,?)').run(u.id, u.username, u.fullName, u.roleId, u.isActive ? 1 : 0, u.lastLogin || null);
    res.json({ success: true });
  });

  app.get('/api/roles', (req, res) => {
    const rows = db.prepare('SELECT * FROM user_roles').all();
    res.json(rows.map((r: any) => ({ ...r, permissions: JSON.parse(r.permissions) })));
  });

  app.post('/api/roles', (req, res) => {
    const r = req.body;
    db.prepare('INSERT OR REPLACE INTO user_roles VALUES (?,?,?)').run(r.id, r.name, JSON.stringify(r.permissions));
    res.json({ success: true });
  });

  app.get('/api/network-info', (req, res) => {
    const nets = networkInterfaces();
    const results: string[] = [];

    for (const name of Object.keys(nets)) {
      for (const net of nets[name]!) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          results.push(net.address);
        }
      }
    }
    res.json({ ips: results, port: PORT });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor RemunPro Centralizado corriendo en http://0.0.0.0:${PORT}`);
    console.log(`Accesible en red local via IP de esta maquina.`);
  });
}

startServer();
