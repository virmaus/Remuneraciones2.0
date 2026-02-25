
import React, { useState } from 'react';
import { FileJson, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { PayrollResult, MonthlyParameters, Company } from '../types';
import { generateUUID } from '../utils/uuid';

interface AccountingExportProps {
  results: PayrollResult[];
  params: MonthlyParameters;
  company: Company | null;
}

export const AccountingExport: React.FC<AccountingExportProps> = ({ results, params, company }) => {
  const [isExporting, setIsExporting] = useState(false);

  const generateVoucher = () => {
    if (!company || results.length === 0) return null;

    const totalGross = results.reduce((acc, r) => acc + r.grossSalary, 0);
    const totalAfp = results.reduce((acc, r) => acc + r.afpAmount, 0);
    const totalHealth = results.reduce((acc, r) => acc + r.healthAmount, 0);
    const totalTax = results.reduce((acc, r) => acc + r.taxAmount, 0);
    const totalNet = results.reduce((acc, r) => acc + r.netSalary, 0);

    // Formato compatible con Contabilidad25
    const voucher = {
      id: generateUUID(),
      companyId: company.id,
      numero: params.lastFolio || 1,
      fecha: new Date(params.year, params.month, 0).toISOString().split('T')[0],
      tipo: 'Centralizacion',
      glosaGeneral: `Centralización Remuneraciones ${params.month}/${params.year}`,
      entradas: [
        { cuenta: '510101', glosa: 'Sueldos y Salarios', debe: totalGross, haber: 0 },
        { cuenta: '210501', glosa: 'AFP por Pagar', debe: 0, haber: totalAfp },
        { cuenta: '210502', glosa: 'Isapre/Fonasa por Pagar', debe: 0, haber: totalHealth },
        { cuenta: '210503', glosa: 'Impuesto Único por Pagar', debe: 0, haber: totalTax },
        { cuenta: '210504', glosa: 'Sueldos por Pagar', debe: 0, haber: totalNet },
      ]
    };

    return voucher;
  };

  const handleExport = () => {
    setIsExporting(true);
    const voucher = generateVoucher();
    
    if (!voucher) {
      alert("No hay datos para exportar.");
      setIsExporting(false);
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(voucher, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `centralizacion_${params.month}_${params.year}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    setTimeout(() => setIsExporting(false), 1000);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Centralización Contable</h3>
          <p className="text-sm text-slate-500">Genera el comprobante para Contabilidad25</p>
        </div>
        <FileJson className="w-8 h-8 text-indigo-500 opacity-20" />
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-500">Periodo:</span>
            <span className="font-medium">{params.month}/{params.year}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-500">Colaboradores procesados:</span>
            <span className="font-medium">{results.length}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 mt-2">
            <div className="flex justify-between text-sm font-bold">
              <span>Total Bruto:</span>
              <span>${results.reduce((acc, r) => acc + r.grossSalary, 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting || results.length === 0}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
        >
          {isExporting ? (
            <CheckCircle2 className="w-5 h-5 animate-bounce" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          {isExporting ? 'Exportando...' : 'Exportar a Contabilidad25'}
        </button>
        
        {results.length === 0 && (
          <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 p-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>Debe procesar la liquidación antes de exportar.</span>
          </div>
        )}
      </div>
    </div>
  );
};
