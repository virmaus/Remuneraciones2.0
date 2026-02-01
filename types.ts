
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
}

export interface Employee {
  id: string;
  companyId: string;
  rut: string;
  firstName: string;
  lastName: string;
  email: string;
  baseSalary: number;
  position: string;
  costCenterId: string;
  supervisorId?: string;
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
  bonuses: number;
  discounts: number;
}

export interface MonthlyParameters {
  id: string;
  year: number;
  month: number;
  uf: number;
  utm: number;
  imm: number;
  sis: number;
  isClosed: boolean;
  lastFolio?: number;
}

export interface AccountingItem {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  costCenter: string;
}

export interface Loan {
  id: string;
  employeeId: string;
  totalAmount: number;
  remainingAmount: number;
  installments: number;
  monthlyAmount: number;
  startDate: string;
}

export interface Vacation {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  daysTaken: number;
}
