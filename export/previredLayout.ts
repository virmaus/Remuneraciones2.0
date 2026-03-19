import { Company, Employee, MonthlyParameters, PayrollResult } from '../types';

const PREVIRED_FIELD_COUNT = 105;

const sanitizeText = (value: string, fallback = ''): string => {
  return (value || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .trim();
};

const cleanRutValue = (rut: string) => rut.replace(/[^0-9kK]/g, '');

const splitRut = (rut: string) => {
  const clean = cleanRutValue(rut);
  return {
    body: clean.slice(0, -1).padStart(9, '0'),
    dv: clean.slice(-1).toUpperCase() || '0',
  };
};

const formatAmount = (value: number) => Math.max(0, Math.round(value)).toString();

const formatDays = (value: number) => Math.max(0, Math.round(value)).toString();

const workedDaysForResult = (result: PayrollResult) =>
  Math.max(0, 30 - (result.absenteeismDays || 0) - (result.medicalLeaveDays || 0) - (result.unpaidLeaveDays || 0));

export const validatePreviredData = (
  employee: Employee,
  result: PayrollResult,
  company: Company,
  params: MonthlyParameters
): string[] => {
  const errors: string[] = [];

  if (cleanRutValue(company.rut).length < 8) errors.push(`Empresa con RUT invalido para ${employee.firstName} ${employee.lastName}`);
  if (cleanRutValue(employee.rut).length < 8) errors.push(`Trabajador ${employee.firstName} ${employee.lastName} con RUT invalido`);
  if (!employee.afpCode) errors.push(`Trabajador ${employee.firstName} ${employee.lastName} sin codigo AFP`);
  if (!employee.healthCode) errors.push(`Trabajador ${employee.firstName} ${employee.lastName} sin codigo salud`);
  if (params.month < 1 || params.month > 12) errors.push('Periodo Previred invalido');
  if (result.taxableSalary < 0 || result.netSalary < 0) errors.push(`Resultado negativo para ${employee.firstName} ${employee.lastName}`);

  return errors;
};

export const buildPreviredFields = (
  employee: Employee,
  result: PayrollResult,
  company: Company,
  params: MonthlyParameters
): string[] => {
  const employeeRut = splitRut(employee.rut);
  const companyRut = splitRut(company.rut);
  const period = `${params.year}${params.month.toString().padStart(2, '0')}`;
  const workedDays = workedDaysForResult(result);

  const fields = Array.from({ length: PREVIRED_FIELD_COUNT }, () => '');

  fields[0] = companyRut.body;
  fields[1] = companyRut.dv;
  fields[2] = employeeRut.body;
  fields[3] = employeeRut.dv;
  fields[4] = sanitizeText(employee.lastName).slice(0, 30);
  fields[5] = sanitizeText(employee.firstName).slice(0, 30);
  fields[6] = 'M';
  fields[7] = '0';
  fields[8] = '1';
  fields[9] = period;
  fields[10] = (employee.afpCode || '01').padStart(2, '0');
  fields[11] = (employee.healthCode || '01').padStart(2, '0');
  fields[12] = employee.afcStatus ? 'S' : 'N';
  fields[13] = formatAmount(result.taxableSalary);
  fields[14] = formatAmount(result.grossSalary);
  fields[15] = formatAmount(result.netSalary);
  fields[16] = formatAmount(result.afpAmount);
  fields[17] = formatAmount(result.healthAmount);
  fields[18] = formatAmount(result.taxAmount);
  fields[19] = formatAmount(result.legalGratification);
  fields[20] = formatAmount(result.bonuses);
  fields[21] = formatAmount(result.discounts);
  fields[22] = formatAmount(result.loanDeduction);
  fields[23] = formatDays(workedDays);
  fields[24] = formatDays(result.absenteeismDays);
  fields[25] = formatDays(result.medicalLeaveDays);
  fields[26] = formatDays(result.unpaidLeaveDays);
  fields[27] = sanitizeText(employee.contractType || 'INDEFINIDO').slice(0, 20);
  fields[28] = sanitizeText(employee.position || 'SIN CARGO').slice(0, 30);
  fields[29] = sanitizeText(employee.costCenterId || 'GENERAL').slice(0, 20);
  fields[30] = sanitizeText(company.activityCode || '000000').slice(0, 10);
  fields[31] = sanitizeText(company.name).slice(0, 40);
  fields[32] = sanitizeText(employee.healthName || 'FONASA').slice(0, 20);
  fields[33] = sanitizeText(employee.afpName || 'AFP').slice(0, 20);
  fields[34] = formatAmount(employee.apvAmount || 0);
  fields[35] = sanitizeText(employee.apvInstitution || '').slice(0, 20);
  fields[36] = formatAmount(employee.heavyWork || 0);
  fields[37] = employee.startDate || '';
  fields[38] = employee.terminationDate || '';
  fields[39] = sanitizeText(employee.terminationCause || '').slice(0, 50);

  return fields;
};

export const serializePreviredRow = (fields: string[]): string => {
  const normalized = [...fields];
  while (normalized.length < PREVIRED_FIELD_COUNT) {
    normalized.push('');
  }
  return normalized.slice(0, PREVIRED_FIELD_COUNT).join(';');
};

export { PREVIRED_FIELD_COUNT };
