
import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, Calculator, BarChart3, Settings, Database,
  Plus, Github, Download, RefreshCw, Lock, Unlock,
  HardDrive, ShieldCheck, AlertCircle, FileSpreadsheet,
  Wallet, TrendingUp, Upload, FileText, CheckCircle2, Save, UserPlus
} from 'lucide-react';
import { Company, Employee, MonthlyParameters, PayrollResult, AccountingItem } from './types';
import { sqliteStore, initSqlite } from './store/sqliteEngine';
import { calculatePayroll } from './services/payrollService';

const CURRENT_VERSION = "v1.2.1";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'payroll' | 'processes' | 'settings'>('dashboard');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollResults, setPayrollResults] = useState<PayrollResult[]>([]);
  const [dbStatus, setDbStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  
  // Estados de Formulario
  const [newCompany, setNewCompany] = useState<Partial<Company>>({ rut: '', name: '', address: '', activityCode: '' });
  const [procTab, setProcTab] = useState<'accounting' | 'increments' | 'import' | 'closing'>('accounting');
  const [salaryInc, setSalaryInc] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const [params, setParams] = useState<MonthlyParameters>({
    id: 'p202403', year: 2024, month: 3, uf: 36800.45, utm: 64793, imm: 460000, sis: 1.61, isClosed: false
  });

  // Inicialización de DB
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
    if (comps.length > 0 && !selectedCompany) {
      setSelectedCompany(comps[0]);
    }
  };

  // Carga de datos dependientes de la empresa seleccionada
  useEffect(() => {
    if (selectedCompany) {
      const emps = sqliteStore.getEmployees(selectedCompany.id);
      setEmployees(emps);
      setPayrollResults(sqliteStore.getPayrollResults(params.month, params.year));
    } else {
      setEmployees([]);
      setPayrollResults([]);
    }
  }, [selectedCompany, params.month, params.year]);

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const company: Company = {
      ...newCompany as Company,
      id: crypto.randomUUID()
    };
    sqliteStore.saveCompany(company);
    setNewCompany({ rut: '', name: '', address: '', activityCode: '' });
    loadCompanies();
    alert("Empresa registrada con éxito");
    setActiveTab('dashboard');
  };

  const handleSalaryIncrease = () => {
    if (!selectedCompany || salaryInc === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      sqliteStore.bulkUpdateSalary(selectedCompany.id, salaryInc);
      const updatedEmps = sqliteStore.getEmployees(selectedCompany.id);
      setEmployees(updatedEmps);
      setIsProcessing(false);
      alert(`Sueldos actualizados en un ${salaryInc}%`);
    }, 800);
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
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-sm font-black tracking-tight leading-none uppercase">RemunPro<br/><span className="text-indigo-400 text-[10px]">Offline Engine</span></h1>
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
             <Download className="w-3 h-3" /> BACKUP .SQLITE
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-50 rounded-lg"><Building2 className="w-4 h-4 text-indigo-500" /></div>
            <select 
              value={selectedCompany?.id || ''} 
              onChange={(e)=>setSelectedCompany(companies.find(c=>c.id===e.target.value)||null)}
              className="text-sm font-black bg-transparent border-none focus:ring-0 uppercase tracking-tighter cursor-pointer"
            >
              {companies.length === 0 && <option value="">SIN EMPRESAS</option>}
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 border ${params.isClosed ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
            <span className="text-[10px] font-black uppercase tracking-wider">Marzo 2024</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {companies.length === 0 && activeTab !== 'settings' ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">No hay empresas</h2>
              <p className="text-slate-500 font-medium leading-relaxed">Para comenzar a operar el sistema offline, debe registrar su primera empresa en el módulo de configuración.</p>
              <button onClick={() => setActiveTab('settings')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all">
                Configurar Empresa
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in zoom-in duration-300">
                  <StatCard label="Colaboradores" value={employees.length} icon={Users} color="text-indigo-600" />
                  <StatCard label="Sueldo Neto" value={`$${payrollResults.reduce((a,b)=>a+b.netSalary,0).toLocaleString()}`} icon={Wallet} color="text-emerald-600" />
                  <StatCard label="Costo Empresa" value={`$${payrollResults.reduce((a,b)=>a+b.grossSalary,0).toLocaleString()}`} icon={TrendingUp} color="text-amber-600" />
                  <StatCard label="Estado SQL" value="READY" icon={Database} color="text-slate-600" />
                </div>
              )}

              {activeTab === 'employees' && (
                 <div className="space-y-6 animate-in fade-in duration-300">
                   <div className="flex justify-between items-center">
                     <h2 className="text-2xl font-black uppercase tracking-tighter italic">Nómina de Personal</h2>
                     <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100">
                       <UserPlus className="w-4 h-4" /> Nuevo Colaborador
                     </button>
                   </div>
                   <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                     <table className="w-full text-left">
                       <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                         <tr>
                           <th className="px-8 py-5">Trabajador</th>
                           <th className="px-8 py-5">Cargo</th>
                           <th className="px-8 py-5 text-right">Sueldo Base</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                         {employees.map(emp => (
                           <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                             <td className="px-8 py-5 font-bold">{emp.firstName} {emp.lastName}</td>
                             <td className="px-8 py-5 text-sm text-slate-500">{emp.position}</td>
                             <td className="px-8 py-5 text-right font-black">${emp.baseSalary.toLocaleString()}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
              )}

              {activeTab === 'settings' && (
                <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter leading-none">Nueva Empresa</h2>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Almacenamiento Local SQLite</span>
                      </div>
                    </div>
                    <form onSubmit={handleAddCompany} className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">RUT Empresa</label>
                        <input required value={newCompany.rut} onChange={e=>setNewCompany({...newCompany, rut: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Ej: 76.123.456-K" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Razón Social</label>
                        <input required value={newCompany.name} onChange={e=>setNewCompany({...newCompany, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Nombre de la empresa" />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dirección Comercial</label>
                        <input value={newCompany.address} onChange={e=>setNewCompany({...newCompany, address: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Av. Principal 123, Santiago" />
                      </div>
                      <button type="submit" className="col-span-2 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 mt-4">
                        <Save className="w-5 h-5" /> Registrar en SQLite
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'processes' && (
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="flex gap-2 p-1 bg-slate-200 w-fit rounded-2xl mb-8">
                    {[{ id: 'accounting', label: 'Voucher', icon: FileText }, { id: 'increments', label: 'Incrementos', icon: TrendingUp }, { id: 'import', label: 'Importación', icon: Upload }].map(t => (
                      <button key={t.id} onClick={() => setProcTab(t.id as any)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${procTab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                        <t.icon className="w-4 h-4" /> {t.label}
                      </button>
                    ))}
                  </div>
                  {procTab === 'accounting' && (
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                       <div className="p-8 border-b border-slate-100 flex justify-between">
                         <h2 className="text-xl font-black uppercase tracking-tighter italic">Voucher de Centralización</h2>
                         <button className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Descargar PDF</button>
                       </div>
                       <table className="w-full text-left">
                         <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                           <tr><th className="px-8 py-4">Cuenta</th><th className="px-8 py-4">Descripción</th><th className="px-8 py-4 text-right">Debe</th><th className="px-8 py-4 text-right">Haber</th></tr>
                         </thead>
                         <tbody className="divide-y">
                           {generateAccountingVoucher().map((item, idx) => (
                             <tr key={idx}><td className="px-8 py-4 font-mono text-xs text-indigo-600">{item.accountCode}</td><td className="px-8 py-4 text-xs font-bold">{item.accountName}</td><td className="px-8 py-4 text-right font-black">{item.debit > 0 ? `$${item.debit.toLocaleString()}` : '-'}</td><td className="px-8 py-4 text-right font-black">{item.credit > 0 ? `$${item.credit.toLocaleString()}` : '-'}</td></tr>
                           ))}
                         </tbody>
                       </table>
                    </div>
                  )}
                  {procTab === 'increments' && (
                    <div className="max-w-xl mx-auto bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
                      <TrendingUp className="w-12 h-12 text-indigo-600 mx-auto mb-6" />
                      <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Reajuste Masivo</h2>
                      <p className="text-slate-500 mb-8 font-medium">Actualiza el sueldo base de todos los trabajadores vigentes.</p>
                      <input type="number" value={salaryInc} onChange={e=>setSalaryInc(Number(e.target.value))} className="w-full px-6 py-5 bg-slate-50 border-none rounded-2xl text-2xl font-black text-center focus:ring-2 focus:ring-indigo-500 mb-6" />
                      <button onClick={handleSalaryIncrease} disabled={isProcessing} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3">
                        {isProcessing ? <RefreshCw className="animate-spin" /> : 'Procesar Incremento'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

// Componentes Auxiliares
const SidebarItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-tight transition-all ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
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
    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-400 animate-pulse">Payroll CORE Digital</h2>
  </div>
);

export default App;
