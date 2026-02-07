
import { Employee, MonthlyParameters, PayrollResult, Loan } from '../types';

export const calculatePayroll = (
  employee: Employee,
  params: MonthlyParameters,
  activeLoans: Loan[] = []
): PayrollResult => {
  const baseSalary = employee.baseSalary;
  
  // Gratificación Legal Art 47
  const monthlyGratificationCap = (params.imm * 4.75) / 12;
  const rawGratification = baseSalary * 0.25;
  const legalGratification = Math.min(rawGratification, monthlyGratificationCap);

  const taxableSalary = baseSalary + legalGratification;
  const taxableCap = params.uf * 81.6;
  const finalTaxable = Math.min(taxableSalary, taxableCap);
  
  // AFP y Salud
  const afpAmount = Math.round(finalTaxable * 0.115);
  const healthAmount = Math.round(finalTaxable * 0.07);
  
  // Préstamos (Cap 6.3)
  const loanDeduction = activeLoans.reduce((acc, l) => acc + (l.remainingAmount > 0 ? l.monthlyAmount : 0), 0);
  
  // Impuesto 2da Categoría
  const taxBase = finalTaxable - afpAmount - healthAmount;
  let taxAmount = 0;
  if (taxBase > params.utm * 13.5) {
    taxAmount = Math.round((taxBase - (params.utm * 13.5)) * 0.04);
  }

  const netSalary = taxableSalary - afpAmount - healthAmount - taxAmount - loanDeduction;

  return {
    id: crypto.randomUUID(),
    employeeId: employee.id,
    month: params.month,
    year: params.year,
    grossSalary: taxableSalary,
    taxableSalary: finalTaxable,
    legalGratification,
    afpAmount,
    healthAmount,
    taxAmount,
    loanDeduction,
    netSalary,
    costCenterId: employee.costCenterId,
    bonuses: 0,
    discounts: 0
  };
};
