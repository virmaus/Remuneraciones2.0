
export enum ModuleType {
  ARCHIVO = 'ARCHIVO',
  MOVIMIENTOS = 'MOVIMIENTOS',
  LIQUIDACIONES = 'LIQUIDACIONES',
  RRHH = 'RRHH',
  FINIQUITOS = 'FINIQUITOS',
  PROCESOS = 'PROCESOS',
  DASHBOARD = 'DASHBOARD',
  CONTABILIDAD = 'CONTABILIDAD'
}

export interface WorkerVacation {
  id: string;
  workerId: string;
  startDate: string;
  endDate: string;
  daysTaken: number;
  status: 'SOLICITADO' | 'APROBADO' | 'RECHAZADO';
}

export interface HR_Evaluation {
  id: string;
  workerId: string;
  date: string;
  score: number;
  comments: string;
  type: 'CUANTITATIVA' | 'CUALITATIVA';
}

export interface Loan {
  id: string;
  employeeId: string;
  totalAmount: number;
  monthlyAmount: number;
  remainingAmount: number;
  installments: number;
  paidInstallments: number;
}

export interface LaborDocument {
  id: string;
  employeeId: string;
  type: string;
  issueDate: string;
  period: string;
  verificationCode: string;
  status: string;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  endpoint: string;
  status: string;
  message: string;
}

export interface Employee {
  id: string;
  companyId: string;
  rut: string;
  firstName: string;
  lastName: string;
  email?: string;
  baseSalary: number;
  position: string;
  costCenterId: string;
  startDate: string;
  contractType: string;
  afpName: string;
  healthName: string;
  isActive: boolean;
  vacationDaysRemaining: number;
  syncStatus: 'SYNCED' | 'PENDING';
  supervisorId?: string;
  bankData?: any;
  terminationDate?: string;
  terminationCause?: string;
}

export interface PayrollResult {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  grossSalary: number;
  taxableSalary: number;
  legalGratification: number;
  taxAmount: number;
  netSalary: number;
  isClosed: boolean;
  afpAmount: number;
  healthAmount: number;
  loanDeduction: number;
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

export interface Company {
  id: string;
  rut: string;
  name: string;
  address: string;
  activityCode: string;
  apiKey?: string;
}

export interface AccountMapping {
  id: string;
  itemName: string;
  accountCode: string;
  accountName: string;
  type: string;
}

export interface FiniquitoRecord {
  id: string;
  employeeId: string;
  terminationDate: string;
  cause: string;
  totalAmount: number;
  yearsOfServiceIndemnity: number;
  vacationIndemnity: number;
  noticeIndemnity: number;
}
