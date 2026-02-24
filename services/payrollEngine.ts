
import Big from 'big.js';
import { Employee, MonthlyParameters, PayrollResult } from '../types';

/**
 * Tabla de Impuesto Único de Segunda Categoría (Chile)
 * Valores expresados en UTM
 */
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

export class PayrollEngine {
  private params: MonthlyParameters;
  private employee: Employee;

  constructor(employee: Employee, params: MonthlyParameters) {
    this.employee = employee;
    this.params = params;
  }

  public calculate(): PayrollResult {
    const inputs = this.normalizeInputs();
    const earnings = this.calculateEarnings(inputs);
    const cotizaciones = this.calculateCotizaciones(earnings);
    const tax = this.calculateTax(earnings, cotizaciones);
    return this.generateResult(earnings, cotizaciones, tax);
  }

  private normalizeInputs() {
    return {
      baseSalary: new Big(this.employee.baseSalary),
      uf: new Big(this.params.uf),
      utm: new Big(this.params.utm),
      imm: new Big(this.params.imm),
      absenteeismDays: new Big(this.employee.absenteeismDays || 0),
      medicalLeaveDays: new Big(this.employee.medicalLeaveDays || 0),
      unpaidLeaveDays: new Big(this.employee.unpaidLeaveDays || 0),
    };
  }

  private calculateEarnings(inputs: any) {
    const totalDiscountDays = inputs.absenteeismDays.plus(inputs.medicalLeaveDays).plus(inputs.unpaidLeaveDays);
    const dayValue = inputs.baseSalary.div(30);
    const absenteeismDiscount = dayValue.times(totalDiscountDays).round(0);
    
    const adjustedBaseSalary = inputs.baseSalary.minus(absenteeismDiscount);
    
    // Gratificación Legal Art 47 (25% con tope de 4.75 IMM)
    const monthlyGratificationCap = inputs.imm.times(4.75).div(12);
    const rawGratification = adjustedBaseSalary.times(0.25);
    const legalGratification = rawGratification.gt(monthlyGratificationCap) 
      ? monthlyGratificationCap 
      : rawGratification;

    const taxableSalary = adjustedBaseSalary.plus(legalGratification);
    
    // Tope Imponible Chile (UF * 81.6 aprox)
    const taxableCap = inputs.uf.times(81.6);
    const finalTaxable = taxableSalary.gt(taxableCap) ? taxableCap : taxableSalary;

    return {
      adjustedBaseSalary,
      legalGratification,
      taxableSalary,
      finalTaxable,
      absenteeismDiscount
    };
  }

  private calculateCotizaciones(earnings: any) {
    // Retenciones Previsionales Reales
    // AFP: 10% + Comisión (Promedio 1.15%)
    // Salud: 7%
    // SIS: Pagado por empleador (pero se registra en parámetros)
    const afpRate = new Big(0.1115); // Ejemplo: 10% + 1.15% comisión
    const healthRate = new Big(0.07);

    const afpAmount = earnings.finalTaxable.times(afpRate).round(0);
    const healthAmount = earnings.finalTaxable.times(healthRate).round(0);

    return {
      afpAmount,
      healthAmount
    };
  }

  private calculateTax(earnings: any, cotizaciones: any) {
    const taxBase = earnings.finalTaxable.minus(cotizaciones.afpAmount).minus(cotizaciones.healthAmount);
    const utm = new Big(this.params.utm);
    const taxBaseInUtm = taxBase.div(utm);
    
    let taxAmount = new Big(0);
    
    // Buscar tramo en la tabla real
    let prevLimit = 0;
    for (const tramo of TAX_TABLE) {
      if (taxBaseInUtm.lte(tramo.limit)) {
        if (tramo.factor > 0) {
          taxAmount = taxBase.times(tramo.factor).minus(utm.times(tramo.deduction)).round(0);
        }
        break;
      }
      prevLimit = tramo.limit;
    }

    return {
      taxAmount
    };
  }

  private generateResult(earnings: any, cotizaciones: any, tax: any): PayrollResult {
    const netSalary = earnings.taxableSalary
      .minus(cotizaciones.afpAmount)
      .minus(cotizaciones.healthAmount)
      .minus(tax.taxAmount);

    return {
      id: crypto.randomUUID(),
      employeeId: this.employee.id,
      month: this.params.month,
      year: this.params.year,
      grossSalary: Number(earnings.taxableSalary.toFixed(0)),
      taxableSalary: Number(earnings.finalTaxable.toFixed(0)),
      legalGratification: Number(earnings.legalGratification.toFixed(0)),
      taxAmount: Number(tax.taxAmount.toFixed(0)),
      netSalary: Number(netSalary.toFixed(0)),
      isClosed: false,
      afpAmount: Number(cotizaciones.afpAmount.toFixed(0)),
      healthAmount: Number(cotizaciones.healthAmount.toFixed(0)),
      loanDeduction: 0,
      costCenterId: this.employee.costCenterId,
      bonuses: 0,
      discounts: Number(earnings.absenteeismDiscount.toFixed(0)),
      absenteeismDays: this.employee.absenteeismDays || 0,
      medicalLeaveDays: this.employee.medicalLeaveDays || 0,
      unpaidLeaveDays: this.employee.unpaidLeaveDays || 0,
      version: 1,
      audit: {
        calculatedAt: new Date().toISOString(),
        calculatedBy: 'SYSTEM_ENGINE_V2_TAX_REAL'
      }
    };
  }
}

export const runPayrollV2 = (employee: Employee, params: MonthlyParameters): PayrollResult => {
  const engine = new PayrollEngine(employee, params);
  return engine.calculate();
};
