
import { Employee, MonthlyParameters, PayrollResult } from '../types';

export const calculatePayroll = (
  employee: Employee,
  params: MonthlyParameters
): PayrollResult => {
  const baseSalary = employee.baseSalary;
  
  // Gratificación Legal (Art 47): 25% del sueldo imponible con tope de 4.75 IMM / 12 meses
  const monthlyGratificationCap = (params.imm * 4.75) / 12;
  const rawGratification = baseSalary * 0.25;
  const legalGratification = Math.min(rawGratification, monthlyGratificationCap);

  const taxableSalary = baseSalary + legalGratification;
  const taxableCap = params.uf * 81.6; // Tope Imponible aproximado
  const finalTaxable = Math.min(taxableSalary, taxableCap);
  
  // AFP (Promedio 11.5%)
  const afpAmount = finalTaxable * 0.115;
  
  // Salud (7% Fonasa o Isapre)
  const healthAmount = finalTaxable * 0.07;
  
  // Impuesto de Segunda Categoría (Simplificado para el demo)
  const taxBase = finalTaxable - afpAmount - healthAmount;
  let taxAmount = 0;
  if (taxBase > params.utm * 13.5) {
    taxAmount = (taxBase - (params.utm * 13.5)) * 0.04;
  }

  const netSalary = taxableSalary - afpAmount - healthAmount - taxAmount;

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
    netSalary,
    costCenterId: employee.costCenterId,
    bonuses: 0,
    discounts: 0
  };
};
