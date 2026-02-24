
import { Company, Employee, PayrollResult, MonthlyParameters, Loan, LaborDocument, ApiLog, AccountMapping, FiniquitoRecord, WorkerVacation } from '../types';

let db: any = null;

export const initSqlite = async (): Promise<void> => {
  try {
    // Verificamos si SQL.js se cargó correctamente desde el CDN
    if (!(window as any).initSqlJs) {
        console.warn("SQL.js no detectado. Operando en modo memoria volátil.");
        // Podríamos implementar un fallback aquí si fuera necesario
        return;
    }

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
  } catch (error) {
    console.error("Error al inicializar base de datos:", error);
  }
};

const createTables = () => {
  if (!db) return;
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, rut TEXT, name TEXT, address TEXT, activityCode TEXT, apiKey TEXT);
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY, companyId TEXT, rut TEXT, firstName TEXT, lastName TEXT, email TEXT, 
      baseSalary REAL, position TEXT, costCenterId TEXT, supervisorId TEXT, startDate TEXT, 
      contractType TEXT, afpName TEXT, healthName TEXT, isActive INTEGER, bankData TEXT,
      terminationDate TEXT, terminationCause TEXT, vacationDaysRemaining REAL,
      absenteeismDays REAL, medicalLeaveDays REAL, unpaidLeaveDays REAL
    );
    CREATE TABLE IF NOT EXISTS vacations (
      id TEXT PRIMARY KEY, workerId TEXT, startDate TEXT, endDate TEXT, daysTaken REAL, status TEXT
    );
    CREATE TABLE IF NOT EXISTS finiquitos (
      id TEXT PRIMARY KEY, employeeId TEXT, terminationDate TEXT, cause TEXT, 
      yearsOfServiceIndemnity REAL, vacationIndemnity REAL, noticeIndemnity REAL, totalAmount REAL
    );
    CREATE TABLE IF NOT EXISTS monthly_parameters (
      id TEXT PRIMARY KEY, year INTEGER, month INTEGER, uf REAL, utm REAL, imm REAL, sis REAL, 
      isClosed INTEGER, lastFolio INTEGER
    );
    CREATE TABLE IF NOT EXISTS payroll_results (
      id TEXT PRIMARY KEY, employeeId TEXT, month INTEGER, year INTEGER, grossSalary REAL, 
      taxableSalary REAL, legalGratification REAL, afpAmount REAL, healthAmount REAL, 
      taxAmount REAL, loanDeduction REAL, netSalary REAL, costCenterId TEXT, bonuses REAL, discounts REAL,
      absenteeismDays REAL, medicalLeaveDays REAL, unpaidLeaveDays REAL
    );
  `);
  persistDb();
};

const persistDb = () => {
  if (!db) return;
  const data = db.export();
  const array = Array.from(data);
  localStorage.setItem('sqlite_db', JSON.stringify(array));
};

export const sqliteStore = {
  saveCompany: (c: Company) => {
    if (!db) return;
    db.run("INSERT OR REPLACE INTO companies VALUES (?,?,?,?,?,?)", [c.id, c.rut, c.name, c.address, c.activityCode, c.apiKey || '']);
    persistDb();
  },
  getCompanies: (): Company[] => {
    if (!db) return [];
    try {
      const res = db.exec("SELECT * FROM companies");
      return res.length > 0 ? res[0].values.map((v: any) => ({ id: v[0], rut: v[1], name: v[2], address: v[3], activityCode: v[4], apiKey: v[5] })) : [];
    } catch (e) { return []; }
  },
  saveEmployee: (e: Employee) => {
    if (!db) return;
    const bankDataStr = e.bankData ? JSON.stringify(e.bankData) : null;
    db.run("INSERT OR REPLACE INTO employees VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
      e.id, e.companyId, e.rut, e.firstName, e.lastName, e.email || '', 
      e.baseSalary, e.position, e.costCenterId, e.supervisorId || '',
      e.startDate, e.contractType, e.afpName, e.healthName, e.isActive ? 1 : 0, bankDataStr,
      e.terminationDate || null, e.terminationCause || null, e.vacationDaysRemaining || 15,
      e.absenteeismDays || 0, e.medicalLeaveDays || 0, e.unpaidLeaveDays || 0
    ]);
    persistDb();
  },
  getEmployees: (companyId: string): Employee[] => {
    if (!db) return [];
    const stmt = db.prepare("SELECT * FROM employees WHERE companyId = ?");
    stmt.bind([companyId]);
    const results = [];
    while (stmt.step()) {
      const v = stmt.get();
      results.push({ 
        id: v[0], companyId: v[1], rut: v[2], firstName: v[3], lastName: v[4], email: v[5], 
        baseSalary: v[6], position: v[7], costCenterId: v[8], supervisorId: v[9],
        startDate: v[10], contractType: v[11], afpName: v[12], healthName: v[13], 
        isActive: v[14] === 1, bankData: v[15] ? JSON.parse(v[15]) : undefined,
        terminationDate: v[16], terminationCause: v[17], vacationDaysRemaining: v[18],
        absenteeismDays: v[19] || 0, medicalLeaveDays: v[20] || 0, unpaidLeaveDays: v[21] || 0
      });
    }
    stmt.free();
    return results;
  },
  saveVacation: (v: WorkerVacation) => {
    if (!db) return;
    db.run("INSERT OR REPLACE INTO vacations VALUES (?,?,?,?,?,?)", [v.id, v.workerId, v.startDate, v.endDate, v.daysTaken, v.status]);
    if (v.status === 'APROBADO') {
      db.run("UPDATE employees SET vacationDaysRemaining = vacationDaysRemaining - ? WHERE id = ?", [v.daysTaken, v.workerId]);
    }
    persistDb();
  },
  getVacations: (): WorkerVacation[] => {
    if (!db) return [];
    const stmt = db.prepare("SELECT * FROM vacations");
    const results = [];
    while (stmt.step()) {
      const v = stmt.get();
      results.push({ id: v[0], workerId: v[1], startDate: v[2], endDate: v[3], daysTaken: v[4], status: v[5] });
    }
    stmt.free();
    return results;
  },
  saveFiniquito: (f: FiniquitoRecord) => {
    if (!db) return;
    db.run("INSERT OR REPLACE INTO finiquitos VALUES (?,?,?,?,?,?,?,?)", [
      f.id, f.employeeId, f.terminationDate, f.cause, f.yearsOfServiceIndemnity, f.vacationIndemnity, f.noticeIndemnity, f.totalAmount
    ]);
    db.run("UPDATE employees SET isActive = 0, terminationDate = ?, terminationCause = ? WHERE id = ?", [f.terminationDate, f.cause, f.employeeId]);
    persistDb();
  },
  getFiniquitos: (): FiniquitoRecord[] => {
    if (!db) return [];
    const stmt = db.prepare("SELECT * FROM finiquitos");
    const results = [];
    while (stmt.step()) {
      const v = stmt.get();
      results.push({ 
        id: v[0], employeeId: v[1], terminationDate: v[2], cause: v[3], 
        yearsOfServiceIndemnity: v[4], vacationIndemnity: v[5], noticeIndemnity: v[6], totalAmount: v[7]
      });
    }
    stmt.free();
    return results;
  },
  savePayrollResult: (r: PayrollResult) => {
    if (!db) return;
    db.run("INSERT OR REPLACE INTO payroll_results VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
      r.id, r.employeeId, r.month, r.year, r.grossSalary, r.taxableSalary, r.legalGratification,
      r.afpAmount, r.healthAmount, r.taxAmount, r.loanDeduction, r.netSalary, r.costCenterId, r.bonuses, r.discounts,
      r.absenteeismDays, r.medicalLeaveDays, r.unpaidLeaveDays
    ]);
    persistDb();
  },
  getPayrollResults: (month: number, year: number): PayrollResult[] => {
    if (!db) return [];
    const stmt = db.prepare("SELECT * FROM payroll_results WHERE month = ? AND year = ?");
    stmt.bind([month, year]);
    const results = [];
    while (stmt.step()) {
      const v = stmt.get();
      results.push({ 
        id: v[0], employeeId: v[1], month: v[2], year: v[3], grossSalary: v[4], 
        taxableSalary: v[5], legalGratification: v[6], afpAmount: v[7], healthAmount: v[8], 
        taxAmount: v[9], loanDeduction: v[10], netSalary: v[11], costCenterId: v[12], bonuses: v[13], discounts: v[14],
        absenteeismDays: v[15] || 0, medicalLeaveDays: v[16] || 0, unpaidLeaveDays: v[17] || 0
      });
    }
    stmt.free();
    return results;
  },
  saveMonthlyParameters: (p: MonthlyParameters) => {
    if (!db) return;
    const id = `${p.year}-${p.month}`;
    db.run("INSERT OR REPLACE INTO monthly_parameters VALUES (?,?,?,?,?,?,?,?,?)", [
      id, p.year, p.month, p.uf, p.utm, p.imm, p.sis, p.isClosed ? 1 : 0, p.lastFolio || 0
    ]);
    persistDb();
  },
  getMonthlyParameters: (month: number, year: number): MonthlyParameters | null => {
    if (!db) return null;
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
    if (!db) return;
    const data = db.export();
    const blob = new Blob([data], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remun_pro_backup_${new Date().toISOString().split('T')[0]}.sqlite`;
    a.click();
  }
};
