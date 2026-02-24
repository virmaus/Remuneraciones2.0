
import { Employee, MonthlyParameters, PayrollResult } from '../types';
import { runPayroll } from '../payroll-engine';

/**
 * @deprecated Use runPayroll from payroll-engine for exact arithmetic and validated logic.
 */
export const calculatePayroll = (
  employee: Employee,
  params: MonthlyParameters
): PayrollResult => {
  return runPayroll(employee, params);
};
