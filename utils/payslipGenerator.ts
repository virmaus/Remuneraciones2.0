
import { Employee, PayrollResult, Company, MonthlyParameters } from '../types';

/**
 * Generador de Boleta de Pago (Liquidación de Sueldo)
 * Cumple con los requisitos de la Dirección del Trabajo (DT)
 */
export const generatePayslipHTML = (
  employee: Employee,
  result: PayrollResult,
  company: Company,
  params: MonthlyParameters
): string => {
  const workedDays = 30 - (result.absenteeismDays || 0) - (result.medicalLeaveDays || 0) - (result.unpaidLeaveDays || 0);
  
  return `
    <div style="font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: auto; border: 1px solid #e2e8f0;">
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; font-style: italic;">${company.name}</h1>
          <p style="font-size: 10px; font-weight: bold; color: #64748b; margin: 5px 0;">RUT: ${company.rut} | ${company.address}</p>
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 16px; font-weight: 900; text-transform: uppercase; margin: 0;">Liquidación de Sueldo</h2>
          <p style="font-size: 12px; font-weight: bold; color: #4f46e5;">PERIODO: ${params.month}/${params.year}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 16px;">
        <div>
          <p style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Trabajador</p>
          <p style="font-size: 14px; font-weight: 900; text-transform: uppercase; margin: 0;">${employee.firstName} ${employee.lastName}</p>
          <p style="font-size: 11px; font-weight: bold; margin: 2px 0;">RUT: ${employee.rut}</p>
          <p style="font-size: 11px; margin: 2px 0;">Cargo: ${employee.position}</p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Detalle Jornada</p>
          <p style="font-size: 11px; margin: 2px 0;">Días Trabajados: <strong>${workedDays}</strong></p>
          <p style="font-size: 11px; margin: 2px 0;">Jornada Semanal: <strong>${employee.jornada} hrs</strong></p>
          <p style="font-size: 11px; margin: 2px 0;">AFP: <strong>${employee.afpName}</strong> | Salud: <strong>${employee.healthName}</strong></p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
        <div>
          <h3 style="font-size: 10px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">Haberes</h3>
          <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
            <tr><td style="padding: 4px 0;">Sueldo Base</td><td style="text-align: right; font-weight: bold;">$${employee.baseSalary.toLocaleString()}</td></tr>
            <tr><td style="padding: 4px 0;">Gratificación Legal</td><td style="text-align: right; font-weight: bold;">$${result.legalGratification.toLocaleString()}</td></tr>
            <tr style="border-top: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: 900; text-transform: uppercase;">Total Haberes</td><td style="text-align: right; font-weight: 900;">$${result.grossSalary.toLocaleString()}</td></tr>
          </table>
        </div>
        <div>
          <h3 style="font-size: 10px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">Descuentos</h3>
          <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
            <tr><td style="padding: 4px 0;">Previsión (AFP)</td><td style="text-align: right; font-weight: bold;">$${result.afpAmount.toLocaleString()}</td></tr>
            <tr><td style="padding: 4px 0;">Salud (7%)</td><td style="text-align: right; font-weight: bold;">$${result.healthAmount.toLocaleString()}</td></tr>
            <tr><td style="padding: 4px 0;">Impuesto Único</td><td style="text-align: right; font-weight: bold;">$${result.taxAmount.toLocaleString()}</td></tr>
            ${result.discounts > 0 ? `<tr><td style="padding: 4px 0;">Inasistencias/Atrasos</td><td style="text-align: right; font-weight: bold;">$${result.discounts.toLocaleString()}</td></tr>` : ''}
            <tr style="border-top: 1px solid #f1f5f9;"><td style="padding: 8px 0; font-weight: 900; text-transform: uppercase;">Total Descuentos</td><td style="text-align: right; font-weight: 900;">$${(result.afpAmount + result.healthAmount + result.taxAmount + result.discounts).toLocaleString()}</td></tr>
          </table>
        </div>
      </div>

      <div style="margin-top: 40px; background: #0f172a; color: white; padding: 24px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Alcance Líquido</span>
        <span style="font-size: 28px; font-weight: 900; font-style: italic;">$${result.netSalary.toLocaleString()}</span>
      </div>

      <div style="margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; text-align: center;">
        <div style="border-top: 1px solid #cbd5e1; padding-top: 10px;">
          <p style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #64748b;">Firma Empleador</p>
        </div>
        <div style="border-top: 1px solid #cbd5e1; padding-top: 10px;">
          <p style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #64748b;">Firma Trabajador</p>
          <p style="font-size: 8px; color: #94a3b8; margin-top: 4px;">Recibí conforme el pago de mis remuneraciones</p>
        </div>
      </div>
      
      <div style="margin-top: 40px; font-size: 8px; color: #94a3b8; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
        Documento generado por RemunPro Local Edition - ID: ${result.id} - Versión: ${result.version}
      </div>
    </div>
  `;
};

export const printPayslip = (html: string) => {
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(`
      <html>
        <head>
          <title>Liquidación de Sueldo</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
          <style>body { margin: 0; padding: 20px; }</style>
        </head>
        <body>${html}</body>
      </html>
    `);
    win.document.close();
    win.print();
  }
};
