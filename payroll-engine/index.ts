import { Employee, MonthlyMovement, MonthlyParameters, PayrollResult } from '../types';
import { calculatePayrollInternal } from './engine';
import { validatePayrollInputs } from './validator';

/**
 * Public payroll engine API.
 */
export const runPayroll = (
  employee: Employee,
  params: MonthlyParameters,
  movements: MonthlyMovement[] = []
): Readonly<PayrollResult> => {
  validatePayrollInputs(employee, params);
  return calculatePayrollInternal(employee, params, movements);
};

export * from './engine';
export * from './movements';
export * from './validator';
