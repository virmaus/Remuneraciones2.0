
import { Employee, MonthlyParameters, PayrollResult } from '../types';
import { validatePayrollInputs } from './validator';
import { calculatePayrollInternal } from './engine';

/**
 * API Pública del Motor de Cálculo de Nómina.
 * Realiza validación de entradas y devuelve un resultado inmutable.
 */
export const runPayroll = (employee: Employee, params: MonthlyParameters): Readonly<PayrollResult> => {
  // 1. Validar entradas
  validatePayrollInputs(employee, params);
  
  // 2. Ejecutar cálculo puro
  return calculatePayrollInternal(employee, params);
};

export * from './validator';
export * from './engine';
