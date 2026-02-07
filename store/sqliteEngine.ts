
import { Company, Employee, PayrollResult, Loan, Vacation, MonthlyParameters } from '../types';

let db: any = null;

export const initSqlite = async (): Promise<void> => {
  const SQL = await (window as any).initSqlJs({
    locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
  });

  const savedDb = localStorage.getItem('sqlite_db');
  if (savedDb) {
    const uint8Array = new Uint8Array(JSON.parse(savedDb));
    db = new SQL.Database(uint8Array);
  } else {
    db = new SQL.Database();
    createTables();
  }
};

const createTables = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, rut TEXT, name TEXT, address TEXT, activityCode TEXT);
    CREATE TABLE IF NOT EXISTS employees (id TEXT PRIMARY KEY, companyId TEXT, rut TEXT, firstName TEXT, lastName TEXT, email TEXT, baseSalary REAL, position TEXT, costCenterId TEXT, supervisorId TEXT);
    CREATE TABLE IF NOT EXISTS payroll_results (id TEXT PRIMARY KEY, employeeId TEXT, month INTEGER, year INTEGER, grossSalary REAL, taxableSalary REAL, afpAmount REAL, healthAmount REAL, taxAmount REAL, netSalary REAL, costCenterId TEXT, bonuses REAL, discounts REAL);
    CREATE TABLE IF NOT EXISTS monthly_parameters (id TEXT PRIMARY KEY, year INTEGER, month INTEGER, uf REAL, utm REAL, imm REAL, sis REAL, isClosed INTEGER, lastFolio INTEGER);
  `);
  persistDb();
};

const persistDb = () => {
  const data = db.export();
  const array = Array.from(data);
  localStorage.setItem('sqlite_db', JSON.stringify(array));
};

export const sqliteStore = {
  saveCompany: (c: Company) => {
    db.run("INSERT OR REPLACE INTO companies VALUES (?,?,?,?,?)", [c.id, c.rut, c.name, c.address, c.activityCode]);
    persistDb();
  },
  getCompanies: (): Company[] => {
    const res = db.exec("SELECT * FROM companies");
    return res.length > 0 ? res[0].values.map((v: any) => ({ id: v[0], rut: v[1], name: v[2], address: v[3], activityCode: v[4] })) : [];
  },
  saveEmployee: (e: Employee) => {
    db.run("INSERT OR REPLACE INTO employees VALUES (?,?,?,?,?,?,?,?,?,?)", [
      e.id, 
      e.companyId, 
      e.rut, 
      e.firstName, 
      e.lastName, 
      e.email || '', 
      e.baseSalary, 
      e.position, 
      e.costCenterId, 
      e.supervisorId || ''
    ]);
    persistDb();
  },
  getEmployees: (companyId: string): Employee[] => {
    const stmt = db.prepare("SELECT * FROM employees WHERE companyId = ?");
    stmt.bind([companyId]);
    const results = [];
    while (stmt.step()) {
      const v = stmt.get();
      results.push({ 
        id: v[0], companyId: v[1], rut: v[2], firstName: v[3], lastName: v[4], 
        email: v[5], baseSalary: v[6], position: v[7], costCenterId: v[8], supervisorId: v[9] 
      });
    }
    stmt.free();
    return results;
  },
  savePayrollResult: (r: PayrollResult) => {
    db.run("INSERT OR REPLACE INTO payroll_results VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", [r.id, r.employeeId, r.month, r.year, r.grossSalary, r.taxableSalary, r.afpAmount, r.healthAmount, r.taxAmount, r.netSalary, r.costCenterId, r.bonuses, r.discounts]);
    persistDb();
  },
  getPayrollResults: (month: number, year: number): PayrollResult[] => {
    const stmt = db.prepare("SELECT * FROM payroll_results WHERE month = ? AND year = ?");
    stmt.bind([month, year]);
    const results = [];
    while (stmt.step()) {
      const v = stmt.get();
      results.push({ 
        id: v[0], employeeId: v[1], month: v[2], year: v[3], grossSalary: v[4], 
        taxableSalary: v[5], afpAmount: v[6], healthAmount: v[7], taxAmount: v[8], 
        netSalary: v[9], costCenterId: v[10], bonuses: v[11], discounts: v[12] 
      });
    }
    stmt.free();
    return results;
  },
  exportBackup: () => {
    const data = db.export();
    const blob = new Blob([data], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remun_pro_backup_${new Date().getTime()}.sqlite`;
    a.click();
  }
};
