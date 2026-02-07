
export enum MovementType {
  NORMAL = 'NORMAL',
  LICENSE = 'LICENSE',
  PERMIT = 'PERMIT',
  FINIQUITO = 'FINIQUITO'
}

export enum ContractType {
  INDEFINITE = 'Indefinido',
  FIXED_TERM = 'Plazo Fijo',
  PROJECT = 'Por Obra o Faena'
}

export enum DocumentType {
  PAYSLIP = 'Liquidación de Sueldo',
  CONTRACT = 'Contrato de Trabajo',
  CERTIFICATE_TENURE = 'Certificado de Antigüedad',
  CERTIFICATE_INCOME = 'Certificado de Renta',
  FINIQUITO = 'Finiquito'
}

export interface LaborDocument {
  id: string;
  employeeId: string;
  type: DocumentType;
  issueDate: string;
  period: string;
  verificationCode: string;
  status: 'SIGNED' | 'DRAFT';
}

export interface ApiLog {
  id: string;
  timestamp: string;
  endpoint: string;
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  message: string;
}

export interface BankData {
  bankName: string;
  accountType: 'Vista' | 'Corriente' | 'Ahorro';
  accountNumber: string;
}

// Added missing Loan interface
export interface Loan {
  id: string;
  employeeId: string;
  totalAmount: number;
  monthlyAmount: number;
  remainingAmount: number;
  installments: number;
  paidInstallments: number;
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
  startDate: string;
  contractType: ContractType;
  afpName: string;
  healthName: string;
  healthPlanValue?: number;
  isActive: boolean;
  bankData?: BankData; // Cap 9.2
  terminationDate?: string;
}

export interface PayrollResult {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  grossSalary: number;
  taxableSalary: number;
  legalGratification: number;
  afpAmount: number;
  healthAmount: number;
  taxAmount: number;
  loanDeduction: number;
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

export interface Company {
  id: string;
  rut: string;
  name: string;
  address: string;
  activityCode: string;
  apiKey?: string; // Cap 9.1
}
