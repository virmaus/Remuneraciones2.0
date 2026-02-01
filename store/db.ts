
import { sqliteStore } from './sqliteEngine';
import { Company, Employee, PayrollResult } from '../types';

export const db = {
  getCompanies: () => sqliteStore.getCompanies(),
  saveCompany: (c: Company) => sqliteStore.saveCompany(c),
  
  getEmployees: (companyId: string) => sqliteStore.getEmployees(companyId),
  saveEmployee: (e: Employee) => sqliteStore.saveEmployee(e),

  // Migración de localStorage antiguo a SQLite
  migrateIfNeeded: () => {
    const oldCompanies = JSON.parse(localStorage.getItem('remun_pro_companies') || '[]');
    if (oldCompanies.length > 0 && sqliteStore.getCompanies().length === 0) {
      console.log("Migrando datos de localStorage a SQLite...");
      oldCompanies.forEach((c: Company) => sqliteStore.saveCompany(c));
      
      const oldEmployees = JSON.parse(localStorage.getItem('remun_pro_employees') || '[]');
      oldEmployees.forEach((e: Employee) => sqliteStore.saveEmployee(e));
      
      // No borramos localStorage por seguridad, pero marcamos como migrado internamente
      localStorage.setItem('migrated_to_sqlite', 'true');
    }
  },

  getPayrollResults: (companyId: string, month: number, year: number): PayrollResult[] => {
    // Implementar lectura desde SQLite cuando la tabla payroll_records esté completa
    return JSON.parse(localStorage.getItem(`remun_pro_payrolls_${companyId}_${year}_${month}`) || '[]');
  },

  savePayrollResults: (companyId: string, month: number, year: number, results: PayrollResult[]) => {
    localStorage.setItem(`remun_pro_payrolls_${companyId}_${year}_${month}`, JSON.stringify(results));
  }
};
