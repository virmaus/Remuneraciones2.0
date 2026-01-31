
export enum MovementType {
  NORMAL = 'NORMAL',
  LICENSE = 'LICENSE',
  PERMIT = 'PERMIT',
  FINIQUITO = 'FINIQUITO'
}

export interface Company {
  id: string;
  rut: string;
  name: string;
  address: string;
  activityCode: string;
  logo?: string;
}

export interface Employee {
  id: string;
  companyId: string;
  rut: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  contractDate: string;
  baseSalary: number;
  afp: string;
  healthSystem: string; // Isapre or Fonasa
  healthPlanValue?: number; // In UF or %
  isapreName?: string;
  costCenterId: string;
  position: string;
}

export interface MonthlyParameters {
  year: number;
  month: number;
  uf: number;
  utm: number;
  imm: number; // Ingreso Mínimo Mensual
  sis: number; // Seguro Invalidez y Sobrevivencia %
}

export interface PayrollResult {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  grossSalary: number;
  taxableSalary: number;
  afpAmount: number;
  healthAmount: number;
  taxAmount: number;
  netSalary: number;
  costCenterId: string;
}

export interface AccountingVoucher {
  id: string;
  date: string;
  description: string;
  type: 'INGRESO' | 'EGRESO' | 'TRASPASO';
  items: {
    accountCode: string;
    debit: number;
    credit: number;
    costCenterId?: string;
  }[];
}
