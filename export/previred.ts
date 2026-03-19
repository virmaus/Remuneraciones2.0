import { Company, Employee, MonthlyParameters, PayrollResult } from '../types';
import {
  buildPreviredFields,
  PREVIRED_FIELD_COUNT,
  serializePreviredRow,
  validatePreviredData,
} from './previredLayout';

/**
 * Previred exporter with a normalized 105-field structure.
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

  public validate(): string[] {
    const errors: string[] = [];

    for (const result of this.results) {
      const employee = this.employees.find(item => item.id === result.employeeId);
      if (!employee) {
        errors.push(`No se encontro colaborador para el resultado ${result.id}`);
        continue;
      }

      errors.push(...validatePreviredData(employee, result, this.company, this.params));
    }

    return errors;
  }

  public generateFileContent(): string {
    return this.results
      .map(result => {
        const employee = this.employees.find(item => item.id === result.employeeId);
        if (!employee) return null;

        const fields = buildPreviredFields(employee, result, this.company, this.params);
        return serializePreviredRow(fields);
      })
      .filter((row): row is string => Boolean(row))
      .join('\r\n');
  }

  public download() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }

    const content = this.generateFileContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `previred_${this.params.year}_${this.params.month}_${PREVIRED_FIELD_COUNT}campos.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
