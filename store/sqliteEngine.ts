
import { Company, Employee, PayrollResult, MonthlyParameters } from '../types';

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
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY, 
      companyId TEXT, 
      rut TEXT, 
      firstName TEXT, 
      lastName TEXT, 
      email TEXT, 
      baseSalary REAL, 
      position TEXT, 
      costCenterId TEXT, 
      supervisorId TEXT,
      startDate TEXT,
      contractType TEXT,
      afpName TEXT,
      healthName TEXT,
      isActive INTEGER
    );
    CREATE TABLE IF NOT EXISTS payroll_results (
      id TEXT PRIMARY KEY, 
      employeeId TEXT, 
      month INTEGER, 
      year INTEGER, 
      grossSalary REAL, 
      taxableSalary REAL, 
      legalGratification REAL,
      afpAmount REAL, 
      healthAmount REAL, 
      taxAmount REAL, 
      netSalary REAL, 
      costCenterId TEXT, 
      bonuses REAL, 
      discounts REAL
    );
    CREATE TABLE IF NOT EXISTS monthly_parameters (
      id TEXT PRIMARY KEY, 
      year INTEGER, 
      month INTEGER, 
      uf REAL, 
      utm REAL, 
      imm REAL, 
      sis REAL, 
      isClosed INTEGER, 
      lastFolio INTEGER
    );
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
    db.run("INSERT OR REPLACE INTO employees VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
      e.id, e.companyId, e.rut, e.firstName, e.lastName, e.email || '', 
      e.baseSalary, e.position, e.costCenterId, e.supervisorId || '',
      e.startDate, e.contractType, e.afpName, e.healthName, e.isActive ? 1 : 0
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
        id: v[0], companyId: v[1], rut: v[2], firstName: v[3], lastName: v[4], email: v[5], 
        baseSalary: v[6], position: v[7], costCenterId: v[8], supervisorId: v[9],
        startDate: v[10], contractType: v[11], afpName: v[12], healthName: v[13], isActive: v[14] === 1
      });
    }
    stmt.free();
    return results;
  },
  savePayrollResult: (r: PayrollResult) => {
    db.run("INSERT OR REPLACE INTO payroll_results VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
      r.id, r.employeeId, r.month, r.year, r.grossSalary, r.taxableSalary, r.legalGratification,
      r.afpAmount, r.healthAmount, r.taxAmount, r.netSalary, r.costCenterId, r.bonuses, r.discounts
    ]);
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
        taxableSalary: v[5], legalGratification: v[6], afpAmount: v[7], healthAmount: v[8], 
        taxAmount: v[9], netSalary: v[10], costCenterId: v[11], bonuses: v[12], discounts: v[13] 
      });
    }
    stmt.free();
    return results;
  },
  saveMonthlyParameters: (p: MonthlyParameters) => {
    const id = `${p.year}-${p.month}`;
    db.run("INSERT OR REPLACE INTO monthly_parameters VALUES (?,?,?,?,?,?,?,?,?)", [
      id, p.year, p.month, p.uf, p.utm, p.imm, p.sis, p.isClosed ? 1 : 0, p.lastFolio || 0
    ]);
    persistDb();
  },
  getMonthlyParameters: (month: number, year: number): MonthlyParameters | null => {
    const id = `${year}-${month}`;
    const stmt = db.prepare("SELECT * FROM monthly_parameters WHERE id = ?");
    stmt.bind([id]);
    let result = null;
    if (stmt.step()) {
      const v = stmt.get();
      result = {
        id: v[0], year: v[1], month: v[2], uf: v[3], utm: v[4], imm: v[5], sis: v[6], 
        isClosed: v[7] === 1, lastFolio: v[8]
      };
    }
    stmt.free();
    return result;
  },
  exportBackup: () => {
    const data = db.export();
    const blob = new Blob([data], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remun_pro_v4_6_${new Date().getTime()}.sqlite`;
    a.click();
  }
};
