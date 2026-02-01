
import { Employee, MonthlyParameters, PayrollResult } from '../types';

export const calculatePayroll = (
  employee: Employee,
  params: MonthlyParameters
): PayrollResult => {
  // Basic Chilean Payroll Calculation Logic
  const grossSalary = employee.baseSalary; // Simple version
  const taxableSalary = Math.min(grossSalary, params.uf * 81.6); // Top taxable 2024 approx
  
  // AFP (Average 11.5%)
  const afpAmount = taxableSalary * 0.115;
  
  // Health (7% or Isapre Plan)
  const healthAmount = taxableSalary * 0.07;
  
  // Simple Tax (Tax bracket logic usually goes here)
  const taxBase = taxableSalary - afpAmount - healthAmount;
  let taxAmount = 0;
  if (taxBase > params.utm * 13.5) {
    taxAmount = taxBase * 0.04; // Very simplified tax bracket
  }

  const netSalary = grossSalary - afpAmount - healthAmount - taxAmount;

  return {
    id: crypto.randomUUID(),
    employeeId: employee.id,
    month: params.month,
    year: params.year,
    grossSalary,
    taxableSalary,
    afpAmount,
    healthAmount,
    taxAmount,
    netSalary,
    // Fix: costCenterId property now exists in PayrollResult type
    costCenterId: employee.costCenterId,
    // Add default values for required properties bonuses and discounts
    bonuses: 0,
    discounts: 0
  };
};

export const generateAccountingVoucher = (results: PayrollResult[]): any => {
  // Group by cost center for centralization logic
  const totalGross = results.reduce((acc, r) => acc + r.grossSalary, 0);
  const totalNet = results.reduce((acc, r) => acc + r.netSalary, 0);
  const totalRetention = totalGross - totalNet;

  return {
    type: 'TRASPASO',
    description: 'Centralización Remuneraciones Mensual',
    items: [
      { accountCode: '5.1.01', debit: totalGross, credit: 0, description: 'Gasto Remuneraciones' },
      { accountCode: '2.1.05', debit: 0, credit: totalRetention, description: 'Leyes Sociales por Pagar' },
      { accountCode: '2.1.06', debit: 0, credit: totalNet, description: 'Sueldos por Pagar' }
    ]
  };
};