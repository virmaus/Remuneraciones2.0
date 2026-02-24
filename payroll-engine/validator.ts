
import { Employee, MonthlyParameters } from '../types';

export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
  }
}

export const validatePayrollInputs = (employee: Employee, params: MonthlyParameters): void => {
  const errors: string[] = [];

  if (!employee.id) errors.push('Employee ID is required');
  if (employee.baseSalary < 0) errors.push('Base salary cannot be negative');
  if (employee.jornada <= 0) errors.push('Jornada must be greater than 0');
  
  if (!params.year || params.year < 2000) errors.push('Invalid year');
  if (params.month < 1 || params.month > 12) errors.push('Invalid month');
  if (params.uf <= 0) errors.push('UF must be greater than 0');
  if (params.utm <= 0) errors.push('UTM must be greater than 0');
  if (params.imm <= 0) errors.push('IMM must be greater than 0');

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};
