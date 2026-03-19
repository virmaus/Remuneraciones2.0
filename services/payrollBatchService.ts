import { Employee, MonthlyMovement, MonthlyParameters, PayrollResult } from '../types';
import { runPayroll } from '../payroll-engine';

interface RunPayrollBatchArgs {
  employees: Employee[];
  params: MonthlyParameters;
  movements: MonthlyMovement[];
  calculatedBy: string;
}

export const buildPayrollResultsForPeriod = ({
  employees,
  params,
  movements,
  calculatedBy,
}: RunPayrollBatchArgs): PayrollResult[] => {
  return employees
    .filter(employee => employee.isActive)
    .map(employee => {
      const employeeMovements = movements.filter(movement => movement.employeeId === employee.id);
      const result = runPayroll(employee, params, employeeMovements);

      return {
        ...result,
        audit: {
          ...result.audit,
          calculatedBy,
        },
      };
    });
};
