
import { Company, Employee, PayrollResult, MonthlyMovement, MonthlyParameters, FiniquitoRecord, WorkerVacation } from '../types';

const API_BASE = '/api';

export const initSqlite = async (): Promise<void> => {
  // No-op for network mode, but we keep it for compatibility
  return Promise.resolve();
};

export const sqliteStore = {
  saveCompany: async (c: Company) => {
    await fetch(`${API_BASE}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c)
    });
  },
  getCompanies: async (): Promise<Company[]> => {
    const res = await fetch(`${API_BASE}/companies`);
    return res.json();
  },
  saveEmployee: async (e: Employee) => {
    await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e)
    });
  },
  getEmployees: async (companyId: string): Promise<Employee[]> => {
    const res = await fetch(`${API_BASE}/employees/${companyId}`);
    return res.json();
  },
  saveVacation: async (v: WorkerVacation) => {
    await fetch(`${API_BASE}/vacations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v)
    });
  },
  getVacations: async (): Promise<WorkerVacation[]> => {
    const res = await fetch(`${API_BASE}/vacations`);
    return res.json();
  },
  saveFiniquito: async (f: FiniquitoRecord) => {
    await fetch(`${API_BASE}/finiquitos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(f)
    });
  },
  getFiniquitos: async (): Promise<FiniquitoRecord[]> => {
    const res = await fetch(`${API_BASE}/finiquitos`);
    return res.json();
  },
  savePayrollResult: async (r: PayrollResult) => {
    await fetch(`${API_BASE}/payroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r)
    });
  },
  getPayrollResults: async (month: number, year: number): Promise<PayrollResult[]> => {
    const res = await fetch(`${API_BASE}/payroll/${month}/${year}`);
    return res.json();
  },
  saveMonthlyParameters: async (p: MonthlyParameters) => {
    await fetch(`${API_BASE}/parameters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
  },
  getMonthlyParameters: async (month: number, year: number): Promise<MonthlyParameters | null> => {
    const res = await fetch(`${API_BASE}/parameters/${month}/${year}`);
    return res.json();
  },
  saveUser: async (u: any) => {
    await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(u)
    });
  },
  getUsers: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  },
  deleteUser: async (id: string, requesterRole: string) => {
    await fetch(`${API_BASE}/users/${id}?requesterRole=${requesterRole}`, {
      method: 'DELETE'
    });
  },
  saveRole: async (r: any) => {
    await fetch(`${API_BASE}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r)
    });
  },
  getRoles: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/roles`);
    return res.json();
  },
  saveMovement: async (m: MonthlyMovement) => {
    await fetch(`${API_BASE}/movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m)
    });
  },
  getMovements: async (companyId: string, month: number, year: number): Promise<MonthlyMovement[]> => {
    const res = await fetch(`${API_BASE}/movements/${companyId}/${month}/${year}`);
    return res.json();
  },
  exportBackup: () => {
    window.open(`${API_BASE}/backup`, '_blank');
  }
};
