
import { Employee, MonthlyParameters, PayrollResult } from '../types';

export const calculatePayroll = (
  employee: Employee,
  params: MonthlyParameters
): PayrollResult => {
  const baseSalary = employee.baseSalary;
  const absenteeismDays = employee.absenteeismDays || 0;
  const medicalLeaveDays = employee.medicalLeaveDays || 0;
  const unpaidLeaveDays = employee.unpaidLeaveDays || 0;
  const totalDiscountDays = absenteeismDays + medicalLeaveDays + unpaidLeaveDays;
  
  // Cálculo de descuentos por días no trabajados
  const dayValue = baseSalary / 30;
  const absenteeismDiscount = Math.round(dayValue * totalDiscountDays);
  
  const adjustedBaseSalary = baseSalary - absenteeismDiscount;
  
  // Cálculo Gratificación Legal Art 47 (25% con tope de 4.75 IMM)
  const monthlyGratificationCap = (params.imm * 4.75) / 12;
  const rawGratification = adjustedBaseSalary * 0.25;
  const legalGratification = Math.min(rawGratification, monthlyGratificationCap);

  const taxableSalary = adjustedBaseSalary + legalGratification;
  const taxableCap = params.uf * 81.6; // Tope Imponible Chile
  const finalTaxable = Math.min(taxableSalary, taxableCap);
  
  // Retenciones Previsionales (Promedios)
  const afpAmount = Math.round(finalTaxable * 0.115);
  const healthAmount = Math.round(finalTaxable * 0.07);
  
  // Impuesto Único de Segunda Categoría (Lógica Simplificada de Escala)
  const taxBase = finalTaxable - afpAmount - healthAmount;
  let taxAmount = 0;
  const utmFactor = params.utm;
  
  if (taxBase > utmFactor * 13.5) {
    // Escala progresiva simplificada
    taxAmount = Math.round((taxBase - (utmFactor * 13.5)) * 0.04);
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
    taxAmount,
    netSalary,
    isClosed: false,
    afpAmount,
    healthAmount,
    loanDeduction: 0,
    costCenterId: employee.costCenterId,
    bonuses: 0,
    discounts: absenteeismDiscount,
    absenteeismDays,
    medicalLeaveDays,
    unpaidLeaveDays
  };
};
