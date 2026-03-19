import { Decimal } from 'decimal.js';
import { Employee, MonthlyMovement, MonthlyParameters, PayrollResult } from '../types';
import { generateUUID } from '../utils/uuid';
import { summarizeMonthlyMovements } from './movements';

// Configure global precision for financial calculations.
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const TAX_TABLE = [
  { limit: 13.5, factor: 0, deduction: 0 },
  { limit: 30, factor: 0.04, deduction: 0.54 },
  { limit: 50, factor: 0.08, deduction: 1.74 },
  { limit: 70, factor: 0.135, deduction: 4.49 },
  { limit: 90, factor: 0.23, deduction: 11.14 },
  { limit: 120, factor: 0.304, deduction: 17.8 },
  { limit: 310, factor: 0.35, deduction: 23.32 },
  { limit: Infinity, factor: 0.4, deduction: 38.82 },
];

/**
 * Pure payroll engine that centralizes remuneration logic.
 */
export const calculatePayrollInternal = (
  employee: Employee,
  params: MonthlyParameters,
  movements: MonthlyMovement[] = []
): Readonly<PayrollResult> => {
  const baseSalary = new Decimal(employee.baseSalary);
  const uf = new Decimal(params.uf);
  const utm = new Decimal(params.utm);
  const imm = new Decimal(params.imm);
  const movementTotals = summarizeMonthlyMovements(employee, params, movements);

  const absenteeismDays = new Decimal(employee.absenteeismDays || 0).plus(movementTotals.absenteeismDays);
  const medicalLeaveDays = new Decimal(employee.medicalLeaveDays || 0).plus(movementTotals.medicalLeaveDays);
  const unpaidLeaveDays = new Decimal(employee.unpaidLeaveDays || 0).plus(movementTotals.unpaidLeaveDays);
  const taxableBonuses = movementTotals.taxableBonuses;
  const nonTaxableBonuses = movementTotals.nonTaxableBonuses;
  const legalMovementDiscounts = movementTotals.legalDiscounts;
  const voluntaryMovementDiscounts = movementTotals.voluntaryDiscounts;
  const loanDeduction = movementTotals.loanDeduction;
  const apvAmount = new Decimal(employee.apvAmount || 0);
  const afcRate = employee.afcStatus ? new Decimal(0.006) : new Decimal(0);
  const heavyWorkRate = new Decimal(employee.heavyWork || 0).div(100);

  const totalDiscountDays = absenteeismDays.plus(medicalLeaveDays).plus(unpaidLeaveDays);
  const dayValue = baseSalary.div(30);
  const dayBasedDiscount = dayValue.times(totalDiscountDays).toDecimalPlaces(0);

  const adjustedBaseSalary = Decimal.max(baseSalary.minus(dayBasedDiscount), 0);

  const monthlyGratificationCap = imm.times(4.75).div(12);
  const rawGratification = adjustedBaseSalary.times(0.25);
  const legalGratification = rawGratification.gt(monthlyGratificationCap)
    ? monthlyGratificationCap
    : rawGratification;

  const taxableSalary = adjustedBaseSalary.plus(legalGratification).plus(taxableBonuses);
  const taxableCap = uf.times(81.6);
  const finalTaxable = taxableSalary.gt(taxableCap) ? taxableCap : taxableSalary;

  const afpRate = new Decimal(0.1115);
  const healthRate = new Decimal(0.07);
  const afpAmount = finalTaxable.times(afpRate).toDecimalPlaces(0);
  const healthAmount = finalTaxable.times(healthRate).toDecimalPlaces(0);
  const afcAmount = finalTaxable.times(afcRate).toDecimalPlaces(0);
  const heavyWorkAmount = finalTaxable.times(heavyWorkRate).toDecimalPlaces(0);

  const taxBase = Decimal.max(
    finalTaxable.minus(afpAmount).minus(healthAmount).minus(afcAmount).minus(heavyWorkAmount).minus(apvAmount),
    0
  );
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

  const totalEarnings = taxableSalary.plus(nonTaxableBonuses);
  const otherDiscounts = legalMovementDiscounts
    .plus(voluntaryMovementDiscounts)
    .plus(apvAmount)
    .plus(afcAmount)
    .plus(heavyWorkAmount);
  const netSalary = totalEarnings
    .minus(afpAmount)
    .minus(healthAmount)
    .minus(taxAmount)
    .minus(otherDiscounts);

  const result: PayrollResult = {
    id: generateUUID(),
    employeeId: employee.id,
    month: params.month,
    year: params.year,
    grossSalary: totalEarnings.toDecimalPlaces(0).toNumber(),
    taxableSalary: finalTaxable.toDecimalPlaces(0).toNumber(),
    legalGratification: legalGratification.toDecimalPlaces(0).toNumber(),
    taxAmount: taxAmount.toDecimalPlaces(0).toNumber(),
    netSalary: netSalary.toDecimalPlaces(0).toNumber(),
    isClosed: false,
    afpAmount: afpAmount.toDecimalPlaces(0).toNumber(),
    healthAmount: healthAmount.toDecimalPlaces(0).toNumber(),
    loanDeduction: loanDeduction.toDecimalPlaces(0).toNumber(),
    costCenterId: employee.costCenterId,
    bonuses: taxableBonuses.plus(nonTaxableBonuses).toDecimalPlaces(0).toNumber(),
    discounts: otherDiscounts.plus(dayBasedDiscount).toDecimalPlaces(0).toNumber(),
    absenteeismDays: absenteeismDays.toNumber(),
    medicalLeaveDays: medicalLeaveDays.toNumber(),
    unpaidLeaveDays: unpaidLeaveDays.toNumber(),
    version: 2,
    audit: {
      calculatedAt: new Date().toISOString(),
      calculatedBy: 'PAYROLL_ENGINE_V5_EXTENDED',
    },
  };

  return Object.freeze(result);
};
