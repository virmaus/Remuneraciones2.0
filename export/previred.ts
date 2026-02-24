
import { Employee, PayrollResult, Company, MonthlyParameters } from '../types';

/**
 * Módulo de exportación Previred (Formato 105 campos)
 * Esta es una implementación simplificada del generador de archivo plano.
 */
export class PreviredExporter {
  private employees: Employee[];
  private results: PayrollResult[];
  private company: Company;
  private params: MonthlyParameters;

  constructor(
    employees: Employee[],
    results: PayrollResult[],
    company: Company,
    params: MonthlyParameters
  ) {
    this.employees = employees;
    this.results = results;
    this.company = company;
    this.params = params;
  }

  public generateFileContent(): string {
    let content = '';
    
    // Header (Opcional según versión, usualmente se omiten en carga masiva simple)
    // Pero generaremos los registros de trabajadores
    
    for (const result of this.results) {
      const employee = this.employees.find(e => e.id === result.employeeId);
      if (!employee) continue;
      
      content += this.generateEmployeeRow(employee, result) + '\r\n';
    }
    
    return content;
  }

  private generateEmployeeRow(employee: Employee, result: PayrollResult): string {
    const fields: string[] = [];
    
    // RUT Trabajador (Sin puntos ni guion, 11 caracteres, relleno ceros izquierda)
    const rutClean = employee.rut.replace(/[^0-9kK]/g, '');
    const rutBody = rutClean.slice(0, -1).padStart(9, '0');
    const rutDv = rutClean.slice(-1).toUpperCase();
    fields.push(rutBody);
    fields.push(rutDv);
    
    // Apellidos y Nombres
    fields.push(employee.lastName.padEnd(30, ' ').slice(0, 30));
    fields.push(employee.firstName.padEnd(30, ' ').slice(0, 30));
    
    // Sexo (M/F) - Por defecto M si no está definido
    fields.push('M');
    
    // Nacionalidad (0: Chilena, 1: Extranjera)
    fields.push('0');
    
    // Tipo Pago (1: Normal, 2: Gratificación, etc)
    fields.push('1');
    
    // Periodo (AAAAMM)
    const period = `${this.params.year}${this.params.month.toString().padStart(2, '0')}`;
    fields.push(period);
    
    // Código AFP (Previred)
    fields.push((employee.afpCode || '01').padStart(2, '0'));
    
    // Renta Imponible
    fields.push(result.taxableSalary.toString().padStart(10, '0'));
    
    // Días Trabajados
    const workedDays = 30 - (result.absenteeismDays || 0) - (result.medicalLeaveDays || 0) - (result.unpaidLeaveDays || 0);
    fields.push(workedDays.toString().padStart(2, '0'));
    
    // ... Muchos otros campos requeridos por el formato 105 campos ...
    // Para efectos de este ejemplo, unimos los campos con punto y coma o ancho fijo
    // El formato real es de ANCHO FIJO.
    
    return fields.join('');
  }

  public download() {
    const content = this.generateFileContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `previred_${this.params.year}_${this.params.month}.txt`;
    a.click();
  }
}
