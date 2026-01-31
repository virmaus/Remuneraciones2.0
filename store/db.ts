
import { Company, Employee, PayrollResult } from '../types';

const STORAGE_KEYS = {
  COMPANIES: 'remun_pro_companies',
  EMPLOYEES: 'remun_pro_employees',
  PAYROLLS: 'remun_pro_payrolls',
  PARAMS: 'remun_pro_params'
};

export const db = {
  getCompanies: (): Company[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANIES) || '[]'),
  saveCompany: (c: Company) => {
    const companies = db.getCompanies();
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify([...companies, c]));
  },
  
  getEmployees: (companyId: string): Employee[] => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]') as Employee[];
    return all.filter(e => e.companyId === companyId);
  },
  
  saveEmployee: (e: Employee) => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]') as Employee[];
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify([...all, e]));
  },

  getPayrollResults: (companyId: string, month: number, year: number): PayrollResult[] => {
    return JSON.parse(localStorage.getItem(`${STORAGE_KEYS.PAYROLLS}_${companyId}_${year}_${month}`) || '[]');
  },

  savePayrollResults: (companyId: string, month: number, year: number, results: PayrollResult[]) => {
    localStorage.setItem(`${STORAGE_KEYS.PAYROLLS}_${companyId}_${year}_${month}`, JSON.stringify(results));
  }
};
