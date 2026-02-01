
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Building2, Calculator, BarChart3, Settings, Database,
  Plus, Github, Download, RefreshCw, Lock, Unlock,
  HardDrive, ShieldCheck, AlertCircle, FileSpreadsheet,
  Wallet, TrendingUp, Upload, FileText, CheckCircle2, Save, UserPlus,
  Calendar, X, Play, Info
} from 'lucide-react';
import { Company, Employee, MonthlyParameters, PayrollResult, AccountingItem } from './types';
import { sqliteStore, initSqlite } from './store/sqliteEngine';
import { calculatePayroll } from './services/payrollService';

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'payroll' | 'processes' | 'settings'>('dashboard');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollResults, setPayrollResults] = useState<PayrollResult[]>([]);
  const [dbStatus, setDbStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  
  // Modales y Formularios
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [empForm, setEmpForm] = useState<Partial<Employee>>({ rut: '', firstName: '', lastName: '', baseSalary: 460000, position: '', costCenterId: 'ADMIN' });
  const [newCompany, setNewCompany] = useState<Partial<Company>>({ rut: '', name: '', address: '', activityCode: '' });
  
  // Procesos State
  const [procTab, setProcTab] = useState<'accounting' | 'increments' | 'import' | 'closing'>('accounting');
  const [salaryInc, setSalaryInc] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [params, setParams] = useState<MonthlyParameters>({
    id: 'p-current', year: 2024, month: 3, uf: 36800.45, utm: 64793, imm: 460000, sis: 1.61, isClosed: false
  });

  useEffect(() => {
    const startup = async () => {
      try {
        await initSqlite();
        setDbStatus('ready');
        loadCompanies();
      } catch (e) {
        setDbStatus('error');
      }
    };
    startup();
  }, []);

  const loadCompanies = () => {
    const comps = sqliteStore.getCompanies();
    setCompanies(comps);
    if (comps.length > 0 && !selectedCompany) setSelectedCompany(comps[0]);
  };

  useEffect(() => {
    if (selectedCompany) {
      setEmployees(sqliteStore.getEmployees(selectedCompany.id));
      setPayrollResults(sqliteStore.getPayrollResults(params.month, params.year));
    }
  }, [selectedCompany, params.month, params.year]);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    const emp: Employee = {
      ...empForm as Employee,
      id: crypto.randomUUID(),
      companyId: selectedCompany.id
    };
    sqliteStore.saveEmployee(emp);
    setEmployees([...employees, emp]);
    setShowEmpModal(false);
    setEmpForm({ rut: '', firstName: '', lastName: '', baseSalary: 460000, position: '', costCenterId: 'ADMIN' });
  };

  const processMonthlyPayroll = () => {
    if (!selectedCompany) return;
    setIsProcessing(true);
    setTimeout(() => {
      const results: PayrollResult[] = employees.map(emp => {
        const res = calculatePayroll(emp, params);
        sqliteStore.savePayrollResult(res);
        return res;
      });
      setPayrollResults(results);
      setIsProcessing(false);
      alert(`Procesadas ${results.length} liquidaciones exitosamente.`);
    }, 1000);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompany) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').slice(1); // Ignorar header
      rows.forEach(row => {
        const [rut, firstName, lastName, salary, position] = row.split(',');
        if (rut && firstName) {
          sqliteStore.saveEmployee({
            id: crypto.randomUUID(),
            companyId: selectedCompany.id,
            rut: rut.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            baseSalary: Number(salary) || 460000,
            position: position?.trim() || 'Operario',
            costCenterId: 'ADMIN',
            email: ''
          });
        }
      });
      setEmployees(sqliteStore.getEmployees(selectedCompany.id));
      alert("Importación masiva completada.");
    };
    reader.readAsText(file);
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
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-sm font-black uppercase tracking-tight">RemunPro <span className="text-indigo-400">9.0</span></h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          <SidebarItem active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} icon={BarChart3} label="Dashboard" />
          <SidebarItem active={activeTab==='employees'} onClick={()=>setActiveTab('employees')} icon={Users} label="Fichas RRHH" />
          <SidebarItem active={activeTab==='payroll'} onClick={()=>setActiveTab('payroll')} icon={Calculator} label="Movimientos" />
          <SidebarItem active={activeTab==='processes'} onClick={()=>setActiveTab('processes')} icon={Settings} label="Procesos (Ch. 9)" />
          <SidebarItem active={activeTab==='settings'} onClick={()=>setActiveTab('settings')} icon={Building2} label="Configuración" />
        </nav>
        <div className="p-4 bg-slate-950/50 border-t border-slate-800">
           <button onClick={() => sqliteStore.exportBackup()} className="w-full py-2 bg-slate-800 rounded-xl text-[10px] font-black hover:bg-slate-700 flex items-center justify-center gap-2 border border-slate-700">
             <Download className="w-3 h-3" /> RESPALDO SQLITE
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <select 
              value={selectedCompany?.id || ''} 
              onChange={(e)=>setSelectedCompany(companies.find(c=>c.id===e.target.value)||null)}
              className="text-sm font-black bg-slate-50 border-none rounded-lg px-4 py-1.5 focus:ring-0 uppercase tracking-tighter cursor-pointer"
            >
              {companies.length === 0 && <option value="">REGISTRE EMPRESA</option>}
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
              <select value={params.month} onChange={(e) => setParams({...params, month: Number(e.target.value)})} className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 px-3 cursor-pointer">
                {MONTHS.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
              </select>
              <select value={params.year} onChange={(e) => setParams({...params, year: Number(e.target.value)})} className="bg-transparent border-none text-[10px] font-black focus:ring-0 px-3 border-l border-slate-200 cursor-pointer">
                {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          {companies.length === 0 && activeTab !== 'settings' ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-6"><AlertCircle className="w-10 h-10" /></div>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Sin Empresa Activa</h2>
              <button onClick={() => setActiveTab('settings')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100">Configurar Ahora</button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in zoom-in duration-300">
                  <StatCard label="Colaboradores" value={employees.length} icon={Users} color="text-indigo-600" />
                  <StatCard label="Sueldo Neto Mes" value={`$${payrollResults.reduce((a,b)=>a+b.netSalary,0).toLocaleString()}`} icon={Wallet} color="text-emerald-600" />
                  <StatCard label="Costo Empresa" value={`$${payrollResults.reduce((a,b)=>a+b.grossSalary,0).toLocaleString()}`} icon={TrendingUp} color="text-amber-600" />
                  <StatCard label="Liquidaciones" value={payrollResults.length} icon={Calculator} color="text-slate-600" />
                </div>
              )}

              {activeTab === 'employees' && (
                 <div className="space-y-6 animate-in fade-in">
                   <div className="flex justify-between items-center">
                     <h2 className="text-2xl font-black uppercase tracking-tighter italic">Fichas de Personal</h2>
                     <button onClick={() => setShowEmpModal(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                       <UserPlus className="w-4 h-4" /> Nuevo Colaborador
                     </button>
                   </div>
                   <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                     <table className="w-full text-left">
                       <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                         <tr><th className="px-8 py-5">RUT</th><th className="px-8 py-5">Nombre</th><th className="px-8 py-5">Cargo</th><th className="px-8 py-5 text-right">Sueldo Base</th></tr>
                       </thead>
                       <tbody className="divide-y">
                         {employees.map(emp => (
                           <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                             <td className="px-8 py-5 font-mono text-xs">{emp.rut}</td>
                             <td className="px-8 py-5 font-bold uppercase">{emp.firstName} {emp.lastName}</td>
                             <td className="px-8 py-5 text-sm text-slate-500 font-medium">{emp.position}</td>
                             <td className="px-8 py-5 text-right font-black text-indigo-600">${emp.baseSalary.toLocaleString()}</td>
                           </tr>
                         ))}
                         {employees.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">No hay trabajadores registrados</td></tr>}
                       </tbody>
                     </table>
                   </div>
                 </div>
              )}

              {activeTab === 'payroll' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter italic">Movimientos del Mes</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Periodo: {MONTHS[params.month-1]} {params.year}</p>
                    </div>
                    <button 
                      onClick={processMonthlyPayroll} 
                      disabled={isProcessing || employees.length === 0}
                      className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50 transition-all"
                    >
                      {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      Procesar Sueldos
                    </button>
                  </div>
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <tr><th className="px-8 py-5">Trabajador</th><th className="px-8 py-5 text-right">Imponible</th><th className="px-8 py-5 text-right">AFP/Salud</th><th className="px-8 py-5 text-right">Alcance Líquido</th><th className="px-8 py-5 text-center">Estado</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {employees.map(emp => {
                          const result = payrollResults.find(r => r.employeeId === emp.id);
                          return (
                            <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-5">
                                <p className="font-bold uppercase text-xs">{emp.firstName} {emp.lastName}</p>
                                <p className="text-[9px] text-slate-400 font-black">{emp.rut}</p>
                              </td>
                              <td className="px-8 py-5 text-right font-bold text-slate-600">{result ? `$${result.taxableSalary.toLocaleString()}` : '-'}</td>
                              <td className="px-8 py-5 text-right text-rose-500 font-bold">{result ? `$${(result.afpAmount + result.healthAmount).toLocaleString()}` : '-'}</td>
                              <td className="px-8 py-5 text-right font-black text-emerald-600">{result ? `$${result.netSalary.toLocaleString()}` : '-'}</td>
                              <td className="px-8 py-5 text-center">
                                {result ? (
                                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase">Calculado</span>
                                ) : (
                                  <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[9px] font-black uppercase">Pendiente</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'processes' && (
                <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">
                  <div className="flex gap-2 p-1 bg-slate-200 w-fit rounded-2xl">
                    {[{ id: 'accounting', label: 'Voucher', icon: FileText }, { id: 'increments', label: 'Incrementos', icon: TrendingUp }, { id: 'import', label: 'Importación', icon: Upload }].map(t => (
                      <button key={t.id} onClick={() => setProcTab(t.id as any)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${procTab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                        <t.icon className="w-4 h-4" /> {t.label}
                      </button>
                    ))}
                  </div>

                  {procTab === 'import' && (
                    <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm text-center max-w-2xl mx-auto">
                      <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8"><FileSpreadsheet className="w-10 h-10" /></div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">Carga Masiva de Personal</h2>
                      <p className="text-slate-500 font-medium mb-8">Suba un archivo CSV con el formato:<br/><code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">rut, nombre, apellido, sueldo, cargo</code></p>
                      <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-3 mx-auto hover:bg-indigo-700 transition-all">
                        <Upload className="w-5 h-5" /> Seleccionar Archivo .CSV
                      </button>
                    </div>
                  )}

                  {procTab === 'accounting' && (
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                       <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                         <h2 className="text-xl font-black uppercase tracking-tighter italic">Voucher de Centralización - {MONTHS[params.month-1]}</h2>
                         <div className="flex gap-3">
                           <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all">Vista Previa</button>
                           <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Contabilizar</button>
                         </div>
                       </div>
                       <table className="w-full text-left">
                         <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                           <tr><th className="px-8 py-5">Código</th><th className="px-8 py-5">Glosa de Cuenta</th><th className="px-8 py-5 text-right">Debe</th><th className="px-8 py-5 text-right">Haber</th></tr>
                         </thead>
                         <tbody className="divide-y">
                           {generateAccountingVoucher().map((item, idx) => (
                             <tr key={idx}><td className="px-8 py-5 font-mono text-xs text-indigo-600 font-bold">{item.accountCode}</td><td className="px-8 py-5 text-xs font-bold uppercase">{item.accountName}</td><td className="px-8 py-5 text-right font-black text-slate-900">{item.debit > 0 ? `$${item.debit.toLocaleString()}` : '-'}</td><td className="px-8 py-5 text-right font-black text-slate-900">{item.credit > 0 ? `$${item.credit.toLocaleString()}` : '-'}</td></tr>
                           ))}
                         </tbody>
                       </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4">
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3 italic"><Building2 className="w-6 h-6 text-indigo-600" /> Registro de Empresa</h2>
                    <form onSubmit={(e) => { e.preventDefault(); const c = {...newCompany, id: crypto.randomUUID()} as Company; sqliteStore.saveCompany(c); loadCompanies(); alert("Empresa registrada."); }} className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RUT Empresa</label>
                        <input required value={newCompany.rut} onChange={e=>setNewCompany({...newCompany, rut: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="76.000.000-K" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Razón Social</label>
                        <input required value={newCompany.name} onChange={e=>setNewCompany({...newCompany, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Empresa S.A." />
                      </div>
                      <button type="submit" className="col-span-2 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                        <Save className="w-5 h-5" /> Guardar en LocalStorage (SQLite)
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal Nuevo Colaborador */}
      {showEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">Nueva Ficha RRHH</h2>
              <button onClick={() => setShowEmpModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddEmployee} className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RUT Trabajador</label>
                <input required value={empForm.rut} onChange={e=>setEmpForm({...empForm, rut: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="12.345.678-9" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo / Puesto</label>
                <input required value={empForm.position} onChange={e=>setEmpForm({...empForm, position: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Gerente, Analista..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombres</label>
                <input required value={empForm.firstName} onChange={e=>setEmpForm({...empForm, firstName: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apellidos</label>
                <input required value={empForm.lastName} onChange={e=>setEmpForm({...empForm, lastName: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sueldo Base Mensual ($)</label>
                <input type="number" required value={empForm.baseSalary} onChange={e=>setEmpForm({...empForm, baseSalary: Number(e.target.value)})} className="w-full px-6 py-4 bg-indigo-50 border-none rounded-xl font-black text-2xl text-indigo-700 focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button type="submit" className="col-span-2 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                <UserPlus className="w-5 h-5" /> Crear Trabajador
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Auxiliares
const SidebarItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-tight transition-all ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800'}`}><Icon className="w-5 h-5" /> {label}</button>
);

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
    <div className={`w-12 h-12 rounded-2xl bg-slate-50 ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}><Icon className="w-6 h-6" /></div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-2xl font-black mt-1 text-slate-900">{value}</p>
  </div>
);

const LoadingScreen = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
    <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8"></div>
    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-400">Payroll Engine Offline</h2>
  </div>
);

export default App;
