
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

export enum TerminationReason {
  ART159_1 = 'Art. 159 N°1 - Mutuo acuerdo',
  ART159_2 = 'Art. 159 N°2 - Renuncia del trabajador',
  ART159_4 = 'Art. 159 N°4 - Vencimiento del plazo',
  ART159_5 = 'Art. 159 N°5 - Conclusión del trabajo',
  ART160 = 'Art. 160 - Conductas indebidas',
  ART161 = 'Art. 161 - Necesidades de la empresa'
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
  // Campos nuevos según guía 4.4.1
  startDate: string;
  contractType: ContractType;
  afpName: string;
  healthName: string; // Fonasa o Isapre
  healthPlanValue?: number; // En UF si es Isapre
  isActive: boolean;
  terminationDate?: string;
  terminationReason?: TerminationReason;
}

export interface PayrollResult {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  grossSalary: number;
  taxableSalary: number;
  legalGratification: number; // Art 47
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
