import { Decimal } from 'decimal.js';
import { Employee, MonthlyMovement, MonthlyParameters } from '../types';

export interface PayrollMovementTotals {
  taxableBonuses: Decimal;
  nonTaxableBonuses: Decimal;
  legalDiscounts: Decimal;
  voluntaryDiscounts: Decimal;
  loanDeduction: Decimal;
  absenteeismDays: Decimal;
  medicalLeaveDays: Decimal;
  unpaidLeaveDays: Decimal;
}

const zeroTotals = (): PayrollMovementTotals => ({
  taxableBonuses: new Decimal(0),
  nonTaxableBonuses: new Decimal(0),
  legalDiscounts: new Decimal(0),
  voluntaryDiscounts: new Decimal(0),
  loanDeduction: new Decimal(0),
  absenteeismDays: new Decimal(0),
  medicalLeaveDays: new Decimal(0),
  unpaidLeaveDays: new Decimal(0),
});

const movementAmountToPesos = (
  movement: MonthlyMovement,
  employee: Employee,
  params: MonthlyParameters
): Decimal => {
  const amount = new Decimal(movement.amount || 0);

  switch (movement.unit) {
    case 'UF':
      return amount.times(params.uf);
    case 'PORCENTAJE':
      return new Decimal(employee.baseSalary).times(amount).div(100);
    case 'HORAS':
      return new Decimal(employee.baseSalary)
        .div(30)
        .div(Math.max(employee.jornada || 45, 1))
        .times(amount);
    case 'DIAS':
      return new Decimal(employee.baseSalary).div(30).times(amount);
    case 'PESOS':
    default:
      return amount;
  }
};

const movementAmountToDays = (movement: MonthlyMovement, employee: Employee): Decimal => {
  const amount = new Decimal(movement.amount || 0);

  switch (movement.unit) {
    case 'HORAS':
      return amount.div(Math.max(employee.jornada || 45, 1)).times(6);
    case 'PESOS':
    case 'UF':
    case 'PORCENTAJE':
      return new Decimal(0);
    case 'DIAS':
    default:
      return amount;
  }
};

export const summarizeMonthlyMovements = (
  employee: Employee,
  params: MonthlyParameters,
  movements: MonthlyMovement[] = []
): PayrollMovementTotals => {
  const totals = zeroTotals();

  for (const movement of movements) {
    const amountInPesos = movementAmountToPesos(movement, employee, params).toDecimalPlaces(0);
    const amountInDays = movementAmountToDays(movement, employee).toDecimalPlaces(2);
    const description = movement.description.toLowerCase();

    switch (movement.type) {
      case 'HABER_IMPONIBLE':
        totals.taxableBonuses = totals.taxableBonuses.plus(amountInPesos);
        break;
      case 'HABER_NO_IMPONIBLE':
        totals.nonTaxableBonuses = totals.nonTaxableBonuses.plus(amountInPesos);
        break;
      case 'DESCUENTO_LEGAL':
        totals.legalDiscounts = totals.legalDiscounts.plus(amountInPesos);
        break;
      case 'DESCUENTO_VOLUNTARIO':
        totals.voluntaryDiscounts = totals.voluntaryDiscounts.plus(amountInPesos);
        if (/(prestamo|pr[eé]stamo|loan|anticipo)/i.test(description)) {
          totals.loanDeduction = totals.loanDeduction.plus(amountInPesos);
        }
        break;
      case 'LICENCIA':
        totals.medicalLeaveDays = totals.medicalLeaveDays.plus(amountInDays);
        if (!amountInPesos.isZero() && amountInDays.isZero()) {
          totals.legalDiscounts = totals.legalDiscounts.plus(amountInPesos);
        }
        break;
      case 'INASISTENCIA':
        totals.absenteeismDays = totals.absenteeismDays.plus(amountInDays);
        if (!amountInPesos.isZero() && amountInDays.isZero()) {
          totals.unpaidLeaveDays = totals.unpaidLeaveDays.plus(amountInPesos.div(new Decimal(employee.baseSalary).div(30)));
        }
        break;
      default:
        break;
    }
  }

  return totals;
};
