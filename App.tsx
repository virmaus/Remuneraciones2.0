
import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, Calculator, BarChart3, Settings, Database,
  Plus, Github, Download, RefreshCw, Lock, Unlock,
  HardDrive, ShieldCheck, AlertCircle, FileSpreadsheet,
  Wallet, TrendingUp, Upload, FileText, CheckCircle2
} from 'lucide-react';
import { Company, Employee, MonthlyParameters, PayrollResult, AccountingItem } from './types';
import { sqliteStore, initSqlite } from './store/sqliteEngine';
import { calculatePayroll } from './services/payrollService';

const CURRENT_VERSION = "v1.2.0";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'payroll' | 'processes' | 'settings'>('dashboard');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollResults, setPayrollResults] = useState<PayrollResult[]>([]);
  const [dbStatus, setDbStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  
  // Procesos State
  const [procTab, setProcTab] = useState<'accounting' | 'increments' | 'import' | 'closing'>('accounting');
  const [salaryInc, setSalaryInc] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const [params, setParams] = useState<MonthlyParameters>({
    id: 'p202403', year: 2024, month: 3, uf: 36800.45, utm: 64793, imm: 460000, sis: 1.61, isClosed: false
  });

  useEffect(() => {
    const startup = async () => {
      try {
        await initSqlite();
        setDbStatus('ready');
        refreshData();
      } catch (e) {
        setDbStatus('error');
      }
    };
    startup();
  }, []);

  const refreshData = () => {
    const comps = sqliteStore.getCompanies();
    setCompanies(comps);
    if (comps.length > 0 && !selectedCompany) setSelectedCompany(comps[0]);
    if (selectedCompany) {
      setEmployees(sqliteStore.getEmployees(selectedCompany.id));
      setPayrollResults(sqliteStore.getPayrollResults(params.month, params.year));
    }
  };

  const handleSalaryIncrease = () => {
    if (!selectedCompany || salaryInc === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      sqliteStore.bulkUpdateSalary(selectedCompany.id, salaryInc);
      refreshData();
      setIsProcessing(false);
      alert(`Sueldos actualizados en un ${salaryInc}%`);
    }, 1000);
  };

  const generateAccountingVoucher = (): AccountingItem[] => {
    const totalGross = payrollResults.reduce((a, b) => a + b.grossSalary, 0);
    const totalAfp = payrollResults.reduce((a, b) => a + b.afpAmount, 0);
    const totalHealth = payrollResults.reduce((a, b) => a + b.healthAmount, 0);
    const totalNet = payrollResults.reduce((a, b) => a + b.netSalary, 0);

    return [
      { accountCode: '510101', accountName: 'Sueldos y Salarios', debit: totalGross, credit: 0, costCenter: 'ADMIN' },
      { accountCode: '210501', accountName: 'AFP por Pagar', debit: 0, credit: totalAfp, costCenter: 'GENERAL' },
      { accountCode: '210502', accountName: 'Isapre por Pagar', debit: 0, credit: totalHealth, costCenter: 'GENERAL' },
      { accountCode: '210301', accountName: 'Remuneraciones por Pagar', debit: 0, credit: totalNet, costCenter: 'GENERAL' },
    ];
  };

  if (dbStatus === 'initializing') return <LoadingScreen />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Sidebar - Secciones 1-9 del Manual */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none">RemunPro Digital</h1>
            <span className="text-[9px] text-slate-500 uppercase font-bold">Capítulo 9 Core</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <SidebarItem active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} icon={BarChart3} label="Dashboard" />
          <SidebarItem active={activeTab==='employees'} onClick={()=>setActiveTab('employees')} icon={Users} label="Fichas RRHH" />
          <SidebarItem active={activeTab==='payroll'} onClick={()=>setActiveTab('payroll')} icon={Calculator} label="Movimientos" />
          <SidebarItem active={activeTab==='processes'} onClick={()=>setActiveTab('processes')} icon={Settings} label="Procesos (Ch. 9)" />
        </nav>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-center">
           <p className="text-[10px] font-black text-slate-500 mb-2 uppercase">Licencia Offline Activa</p>
           <button onClick={() => sqliteStore.exportBackup()} className="w-full py-2 bg-indigo-600 rounded-xl text-[10px] font-black hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
             <Download className="w-3 h-3" /> RESPALDO .SQLITE
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <Building2 className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Empresa:</span>
            <select 
              value={selectedCompany?.id} 
              onChange={(e)=>setSelectedCompany(companies.find(c=>c.id===e.target.value)||null)}
              className="text-sm font-bold bg-slate-50 border-none rounded-lg px-3 py-1.5 focus:ring-0 uppercase tracking-tighter"
            >
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 border ${params.isClosed ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
              {params.isClosed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span className="text-[10px] font-black uppercase tracking-wider">Periodo: Marzo 2024</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {activeTab === 'processes' && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Sub-Tabs de Procesos */}
              <div className="flex gap-2 p-1 bg-slate-200 w-fit rounded-2xl mb-8">
                {[
                  { id: 'accounting', label: 'Centralización', icon: FileText },
                  { id: 'increments', label: 'Incrementos', icon: TrendingUp },
                  { id: 'import', label: 'Importación', icon: Upload },
                  { id: 'closing', label: 'Cierre', icon: Lock }
                ].map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setProcTab(t.id as any)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${procTab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <t.icon className="w-4 h-4" /> {t.label}
                  </button>
                ))}
              </div>

              {/* 9.3 Centralización Contable */}
              {procTab === 'accounting' && (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tighter">Voucher de Centralización</h2>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1">Generación automática de asientos contables del mes</p>
                    </div>
                    <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                      Exportar a ERP Contable
                    </button>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-4">Cuenta</th>
                        <th className="px-8 py-4">Descripción</th>
                        <th className="px-8 py-4">C. Costo</th>
                        <th className="px-8 py-4 text-right">Debe</th>
                        <th className="px-8 py-4 text-right">Haber</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {generateAccountingVoucher().map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-4 font-mono text-xs text-indigo-600 font-bold">{item.accountCode}</td>
                          <td className="px-8 py-4 text-xs font-bold text-slate-700">{item.accountName}</td>
                          <td className="px-8 py-4 text-[10px] font-black text-slate-400">{item.costCenter}</td>
                          <td className="px-8 py-4 text-right font-black text-slate-900">{item.debit > 0 ? `$${item.debit.toLocaleString()}` : '-'}</td>
                          <td className="px-8 py-4 text-right font-black text-slate-900">{item.credit > 0 ? `$${item.credit.toLocaleString()}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 9.8 Incrementos de Renta */}
              {procTab === 'increments' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center gap-3 text-indigo-600">
                      <TrendingUp className="w-6 h-6" /> Reajuste Masivo de Sueldos
                    </h3>
                    <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
                      Este proceso actualiza el Sueldo Base de <b>todos</b> los trabajadores vigentes en la empresa seleccionada. 
                      Los cambios se aplican directamente sobre la ficha de cada colaborador.
                    </p>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Porcentaje de Incremento (%)</label>
                        <input 
                          type="number" 
                          value={salaryInc}
                          onChange={(e)=>setSalaryInc(Number(e.target.value))}
                          className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-lg font-black focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                      <button 
                        onClick={handleSalaryIncrease}
                        disabled={isProcessing}
                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
                      >
                        {isProcessing ? <RefreshCw className="animate-spin" /> : 'Procesar Incremento'}
                      </button>
                    </div>
                  </div>
                  <div className="bg-indigo-600 p-10 rounded-[2.5rem] text-white flex flex-col justify-center relative overflow-hidden">
                    <div className="relative z-10">
                      <CheckCircle2 className="w-12 h-12 mb-6 opacity-50" />
                      <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight mb-4">Control de Auditoría</h3>
                      <p className="text-indigo-100 text-sm leading-relaxed font-medium">
                        Todo incremento masivo genera un respaldo automático en la tabla histórica de remuneraciones antes de ser aplicado.
                      </p>
                    </div>
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                  </div>
                </div>
              )}

              {/* 9.5 Cierre Mensual */}
              {procTab === 'closing' && (
                <div className="bg-rose-50 border border-rose-100 p-12 rounded-[2.5rem] text-center max-w-2xl mx-auto">
                  <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-10 h-10 text-rose-600" />
                  </div>
                  <h2 className="text-2xl font-black text-rose-900 uppercase tracking-tighter mb-4 italic">Cierre Crítico de Periodo</h2>
                  <p className="text-rose-700 font-medium mb-8">
                    Al cerrar el mes de Marzo 2024, no se podrán editar más liquidaciones, haberes o descuentos. 
                    El sistema habilitará automáticamente el periodo Abril 2024.
                  </p>
                  <button 
                    onClick={() => {
                      if(confirm("¿Está seguro? Esta acción bloqueará permanentemente el periodo actual.")) {
                        setParams({...params, isClosed: true});
                      }
                    }}
                    className="px-10 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all"
                  >
                    Confirmar Cierre de Mes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Otros tabs existentes (employees, dashboard, etc.) */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in zoom-in duration-300">
              <StatCard label="Colaboradores" value={employees.length} icon={Users} color="text-indigo-600" />
              <StatCard label="Sueldo Neto Total" value={`$${payrollResults.reduce((a,b)=>a+b.netSalary,0).toLocaleString()}`} icon={Wallet} color="text-emerald-600" />
              <StatCard label="Costo Empresa" value={`$${payrollResults.reduce((a,b)=>a+b.grossSalary,0).toLocaleString()}`} icon={TrendingUp} color="text-amber-600" />
              <StatCard label="Estado DB" value="SQLITE" icon={Database} color="text-slate-600" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Componentes Auxiliares
const SidebarItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-tighter transition-all ${
      active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800'
    }`}
  >
    <Icon className="w-5 h-5" /> {label}
  </button>
);

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
    <div className={`w-12 h-12 rounded-2xl bg-slate-50 ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-2xl font-black mt-1 text-slate-900">{value}</p>
  </div>
);

const LoadingScreen = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
    <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8"></div>
    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-400">Payroll System Engine</h2>
    <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">Cargando base de datos SQLite ACID...</p>
  </div>
);

export default App;
