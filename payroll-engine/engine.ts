
import { Decimal } from 'decimal.js';
import { Employee, MonthlyParameters, PayrollResult } from '../types';

// Configurar precisión global para cálculos financieros
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const TAX_TABLE = [
  { limit: 13.5, factor: 0, deduction: 0 },
  { limit: 30, factor: 0.04, deduction: 0.54 },
  { limit: 50, factor: 0.08, deduction: 1.74 },
  { limit: 70, factor: 0.135, deduction: 4.49 },
  { limit: 90, factor: 0.23, deduction: 11.14 },
  { limit: 120, factor: 0.304, deduction: 17.8 },
  { limit: 310, factor: 0.35, deduction: 23.32 },
  { limit: Infinity, factor: 0.40, deduction: 38.82 }
];

/**
 * Módulo puro de cálculo de nómina.
 * No tiene efectos secundarios y garantiza inmutabilidad en la salida.
 */
export const calculatePayrollInternal = (employee: Employee, params: MonthlyParameters): Readonly<PayrollResult> => {
  // 1. Normalización de entradas
  const baseSalary = new Decimal(employee.baseSalary);
  const uf = new Decimal(params.uf);
  const utm = new Decimal(params.utm);
  const imm = new Decimal(params.imm);
  const absenteeismDays = new Decimal(employee.absenteeismDays || 0);
  const medicalLeaveDays = new Decimal(employee.medicalLeaveDays || 0);
  const unpaidLeaveDays = new Decimal(employee.unpaidLeaveDays || 0);

  // 2. Cálculo de Haberes
  const totalDiscountDays = absenteeismDays.plus(medicalLeaveDays).plus(unpaidLeaveDays);
  const dayValue = baseSalary.div(30);
  const absenteeismDiscount = dayValue.times(totalDiscountDays).toDecimalPlaces(0);
  
  const adjustedBaseSalary = baseSalary.minus(absenteeismDiscount);
  
  // Gratificación Legal Art 47 (25% con tope de 4.75 IMM)
  const monthlyGratificationCap = imm.times(4.75).div(12);
  const rawGratification = adjustedBaseSalary.times(0.25);
  const legalGratification = rawGratification.gt(monthlyGratificationCap) 
    ? monthlyGratificationCap 
    : rawGratification;

  const taxableSalary = adjustedBaseSalary.plus(legalGratification);
  
  // Tope Imponible Chile (UF * 81.6 aprox)
  const taxableCap = uf.times(81.6);
  const finalTaxable = taxableSalary.gt(taxableCap) ? taxableCap : taxableSalary;

  // 3. Cálculo de Cotizaciones
  const afpRate = new Decimal(0.1115); 
  const healthRate = new Decimal(0.07);

  const afpAmount = finalTaxable.times(afpRate).toDecimalPlaces(0);
  const healthAmount = finalTaxable.times(healthRate).toDecimalPlaces(0);

  // 4. Cálculo de Impuestos
  const taxBase = finalTaxable.minus(afpAmount).minus(healthAmount);
  const taxBaseInUtm = taxBase.div(utm);
  
  let taxAmount = new Decimal(0);
  
  for (const tramo of TAX_TABLE) {
    if (taxBaseInUtm.lte(tramo.limit)) {
      if (tramo.factor > 0) {
        taxAmount = taxBase.times(tramo.factor).minus(utm.times(tramo.deduction)).toDecimalPlaces(0);
      }
      break;
    }
  }

  // 5. Cálculo Líquido
  const netSalary = taxableSalary
    .minus(afpAmount)
    .minus(healthAmount)
    .minus(taxAmount);

  // 6. Construcción del Resultado Inmutable
  const result: PayrollResult = {
    id: crypto.randomUUID(),
    employeeId: employee.id,
    month: params.month,
    year: params.year,
    grossSalary: taxableSalary.toDecimalPlaces(0).toNumber(),
    taxableSalary: finalTaxable.toDecimalPlaces(0).toNumber(),
    legalGratification: legalGratification.toDecimalPlaces(0).toNumber(),
    taxAmount: taxAmount.toDecimalPlaces(0).toNumber(),
    netSalary: netSalary.toDecimalPlaces(0).toNumber(),
    isClosed: false,
    afpAmount: afpAmount.toDecimalPlaces(0).toNumber(),
    healthAmount: healthAmount.toDecimalPlaces(0).toNumber(),
    loanDeduction: 0,
    costCenterId: employee.costCenterId,
    bonuses: 0,
    discounts: absenteeismDiscount.toDecimalPlaces(0).toNumber(),
    absenteeismDays: employee.absenteeismDays || 0,
    medicalLeaveDays: employee.medicalLeaveDays || 0,
    unpaidLeaveDays: employee.unpaidLeaveDays || 0,
    version: 1,
    audit: {
      calculatedAt: new Date().toISOString(),
      calculatedBy: 'PAYROLL_ENGINE_V4_PURE'
    }
  };

  return Object.freeze(result);
};
