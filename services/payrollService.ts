
import { Employee, MonthlyParameters, PayrollResult } from '../types';
import { runPayrollV2 } from './payrollEngine';

/**
 * @deprecated Use runPayrollV2 from payrollEngine.ts for exact arithmetic and layered logic.
 */
export const calculatePayroll = (
  employee: Employee,
  params: MonthlyParameters
): PayrollResult => {
  return runPayrollV2(employee, params);
};
