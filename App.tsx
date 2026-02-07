
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Building2, Calculator, BarChart3, Settings,
  Download, RefreshCw, Unlock, Lock, ShieldCheck, AlertCircle, FileSpreadsheet,
  Wallet, TrendingUp, Upload, FileText, CheckCircle2, Save, UserPlus,
  Calendar, X, Play, Info, Mail, Briefcase, HeartPulse, CheckCircle, FileJson, Layers,
  PieChart as PieIcon, TrendingDown, ArrowUpRight, ArrowDownRight, Printer, FileBadge, 
  QrCode, Network, Link2, Server, Globe, Activity, Database, Plus, Trash2, ListChecks
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import { Company, Employee, MonthlyParameters, PayrollResult, ContractType, DocumentType, LaborDocument, ApiLog } from './types';
import { sqliteStore, initSqlite } from './store/sqliteEngine';
import { calculatePayroll } from './services/payrollService';

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'payroll' | 'processes' | 'analytics' | 'documents'>('dashboard');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollResults, setPayrollResults] = useState<PayrollResult[]>([]);
  const [dbStatus, setDbStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  
  // States for Processes (Cap 9)
  const [centralizationType, setCentralizationType] = useState<'detail' | 'summary'>('summary');
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [newEmpForm, setNewEmpForm] = useState<Partial<Employee>>({
    rut: '', firstName: '', lastName: '', baseSalary: 460000, position: '', contractType: ContractType.INDEFINITE, afpName: 'Provida', healthName: 'Fonasa'
  });

  const [params, setParams] = useState<MonthlyParameters>({
    id: 'p-current', year: 2024, month: 3, uf: 36800.45, utm: 64793, imm: 460000, sis: 1.61, isClosed: false, lastFolio: 0
  });

  useEffect(() => {
    const startup = async () => {
      try {
        await initSqlite();
        setDbStatus('ready');
        let comps = sqliteStore.getCompanies();
        if (comps.length === 0) {
          const demoCompany = { id: crypto.randomUUID(), rut: '76.123.456-K', name: 'Corporación Industrial S.A.', address: 'Panamericana Norte 1200', activityCode: '620100' };
          sqliteStore.saveCompany(demoCompany);
          comps = [demoCompany];
        }
        setCompanies(comps);
        if (comps.length > 0) setSelectedCompany(comps[0]);
      } catch (e) { setDbStatus('error'); }
    };
    startup();
  }, []);

  useEffect(() => {
    if (dbStatus === 'ready' && selectedCompany) {
      const storedParams = sqliteStore.getMonthlyParameters(params.month, params.year);
      if (storedParams) setParams(storedParams);
      setEmployees(sqliteStore.getEmployees(selectedCompany.id));
      setPayrollResults(sqliteStore.getPayrollResults(params.month, params.year));
    }
  }, [selectedCompany, params.month, params.year, dbStatus]);

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    const emp: Employee = { ...newEmpForm as Employee, id: crypto.randomUUID(), companyId: selectedCompany.id, costCenterId: 'ADM-01', startDate: new Date().toISOString(), isActive: true };
    sqliteStore.saveEmployee(emp);
    setEmployees(prev => [...prev, emp]);
    setShowEmpModal(false);
  };

  const toggleMonthLock = () => {
    const newParams = { ...params, isClosed: !params.isClosed };
    sqliteStore.saveMonthlyParameters(newParams);
    setParams(newParams);
  };

  const centralizarContabilidad = () => {
    alert(`Centralización generada (${centralizationType === 'detail' ? 'Detallada' : 'Resumida'}). Asiento enviado a cola de espera ERP.`);
  };

  const stats = useMemo(() => ({
    bruto: payrollResults.reduce((a, b) => a + b.grossSalary, 0),
    liquido: payrollResults.reduce((a, b) => a + b.netSalary, 0),
    count: employees.length
  }), [payrollResults, employees]);

  if (dbStatus === 'initializing') return <LoadingScreen />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><ShieldCheck className="w-6 h-6" /></div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tighter">RemunPro</h1>
              <p className="text-[10px] text-emerald-400 font-bold uppercase italic">Chapter 9 System</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          <SidebarItem active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} icon={BarChart3} label="Dashboard" />
          <SidebarItem active={activeTab==='employees'} onClick={()=>setActiveTab('employees')} icon={Users} label="RRHH (Fichas)" />
          <SidebarItem active={activeTab==='payroll'} onClick={()=>setActiveTab('payroll')} icon={Calculator} label="Cálculos" />
          <SidebarItem active={activeTab==='processes'} onClick={()=>setActiveTab('processes')} icon={Layers} label="Procesos (Cap 9)" />
          <SidebarItem active={activeTab==='analytics'} onClick={()=>setActiveTab('analytics')} icon={PieIcon} label="Analítica" />
          <SidebarItem active={activeTab==='documents'} onClick={()=>setActiveTab('documents')} icon={FileBadge} label="Documentos" />
        </nav>

        <div className="p-6 border-t border-slate-800">
          <button onClick={() => sqliteStore.exportBackup()} className="w-full py-4 bg-slate-800 rounded-2xl text-[10px] font-black hover:bg-slate-700 flex items-center justify-center gap-3 border border-slate-700 transition-all uppercase">
            <Download className="w-4 h-4" /> Exportar SQLite
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {params.isClosed && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 z-50 animate-pulse"></div>
        )}

        <header className="h-24 bg-white border-b border-slate-200 flex items-center justify-between px-10 shadow-sm z-10">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Empresa Operativa</span>
            <select 
              value={selectedCompany?.id || ''} 
              onChange={(e)=>setSelectedCompany(companies.find(c=>c.id===e.target.value)||null)}
              className="text-sm font-black bg-transparent border-none p-0 uppercase focus:ring-0 cursor-pointer"
            >
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center bg-slate-100 rounded-3xl p-1.5 border border-slate-200">
              <select value={params.month} onChange={(e) => setParams({...params, month: Number(e.target.value)})} className="bg-transparent border-none text-[11px] font-black uppercase px-6 focus:ring-0">
                {MONTHS.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
              </select>
              <div className="w-px h-6 bg-slate-300 mx-2"></div>
              <select value={params.year} onChange={(e) => setParams({...params, year: Number(e.target.value)})} className="bg-transparent border-none text-[11px] font-black px-6 focus:ring-0">
                {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            
            <button onClick={toggleMonthLock} className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all ${params.isClosed ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'}`}>
              {params.isClosed ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-widest">{params.isClosed ? 'Periodo Bloqueado' : 'Periodo Abierto'}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
          {/* TAB: RRHH (Fichas) */}
          {activeTab === 'employees' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic">Nómina de Colaboradores</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Gestión de Fichas del Personal e Información Base</p>
                </div>
                <button onClick={() => setShowEmpModal(true)} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-[11px] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all">
                  <UserPlus className="w-5 h-5" /> Crear Nueva Ficha
                </button>
              </div>

              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr>
                      <th className="px-10 py-6">Colaborador</th>
                      <th className="px-10 py-6">RUT</th>
                      <th className="px-10 py-6">Cargo</th>
                      <th className="px-10 py-6 text-right">Sueldo Base</th>
                      <th className="px-10 py-6 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-10 py-6">
                          <div className="text-xs font-black uppercase">{e.firstName} {e.lastName}</div>
                          <div className="text-[9px] text-slate-400 font-bold">{e.contractType}</div>
                        </td>
                        <td className="px-10 py-6 text-[11px] font-bold text-slate-500">{e.rut}</td>
                        <td className="px-10 py-6 text-xs text-slate-600 font-medium italic">{e.position || 'Sin Cargo'}</td>
                        <td className="px-10 py-6 text-right font-black text-indigo-600">${e.baseSalary.toLocaleString()}</td>
                        <td className="px-10 py-6 text-center">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase">Activo</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PROCESOS (CAP 9) */}
          {activeTab === 'processes' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter italic">Procesos y Centralización</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 tracking-[0.2em]">Cierre Mensual, Foliación e Interfaz Contable</p>
              </div>

              <div className="grid grid-cols-3 gap-8">
                {/* Foliar Libro */}
                <ProcessCard 
                  title="Foliar Libro Remu" 
                  icon={FileSpreadsheet} 
                  desc="Asignar números de folio correlativos para timbraje electrónico."
                  onClick={() => {
                    const nextFolio = Number(prompt("Último folio utilizado:", params.lastFolio || 0)) + 1;
                    setParams({...params, lastFolio: nextFolio});
                    alert(`Siguiente folio asignado: ${nextFolio}`);
                  }}
                  actionLabel={`Folio Actual: ${params.lastFolio || 0}`}
                />

                {/* Centralización */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6"><Database className="w-7 h-7" /></div>
                    <h4 className="text-lg font-black uppercase italic mb-3">Centralizar</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed mb-6">Generar comprobante contable de sueldos y leyes sociales.</p>
                    <div className="flex gap-2 mb-6">
                      <button onClick={()=>setCentralizationType('summary')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${centralizationType==='summary' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>Resumido</button>
                      <button onClick={()=>setCentralizationType('detail')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${centralizationType==='detail' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>Detallado</button>
                    </div>
                  </div>
                  <button onClick={centralizarContabilidad} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Generar Asiento
                  </button>
                </div>

                {/* Utilidades de Mantenimiento */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6"><Settings className="w-7 h-7" /></div>
                    <h4 className="text-lg font-black uppercase italic mb-3">Mantenimiento</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed mb-6">Herramientas de limpieza y configuración técnica del periodo.</p>
                    <div className="space-y-3">
                       <UtilButton icon={Trash2} label="Borrar Retenciones" onClick={() => alert("Retenciones del periodo eliminadas.")} color="text-rose-600" />
                       <UtilButton icon={Upload} label="Importar Datos" onClick={() => alert("Iniciando asistente de importación CSV/Excel...")} color="text-indigo-600" />
                       <UtilButton icon={ListChecks} label="Asignar Cuentas" onClick={() => alert("Abriendo configuración de cuentas contables...")} color="text-slate-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gratificación Anual / Cierre */}
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-emerald-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                  <TrendingUp className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                  <h3 className="text-2xl font-black uppercase italic mb-4">Gratificación Anual</h3>
                  <p className="text-xs font-medium opacity-80 leading-relaxed max-w-sm mb-8">
                    Proceso de reliquidación de gratificación según Art. 47 y 50 del Código del Trabajo. Cálculo basado en utilidad líquida anual.
                  </p>
                  <button className="px-8 py-3 bg-white text-emerald-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-colors">Ejecutar Cálculo</button>
                </div>

                <div className="bg-indigo-900 p-10 rounded-[3.5rem] text-white shadow-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-black uppercase italic mb-4">Cierre del Mes</h3>
                    <p className="text-xs font-medium opacity-80 leading-relaxed mb-6">El cierre inhabilita cualquier modificación posterior en cálculos o fichas para este periodo.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={toggleMonthLock} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${params.isClosed ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                      {params.isClosed ? 'Desbloquear Mes' : 'Cerrar y Bloquear'}
                    </button>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${params.isClosed ? 'border-rose-400 bg-rose-400/20' : 'border-emerald-400 bg-emerald-400/20'}`}>
                      {params.isClosed ? <Lock className="w-5 h-5 text-rose-300" /> : <Unlock className="w-5 h-5 text-emerald-300" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DASHBOARD (Resumen Cap 9) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="grid grid-cols-4 gap-8">
                 <StatCard label="Colaboradores" value={stats.count} sub="Fichas" icon={Users} color="text-indigo-600" />
                 <StatCard label="Costo Bruto" value={`$${stats.bruto.toLocaleString()}`} sub="Mes" icon={Wallet} color="text-emerald-600" />
                 <StatCard label="Último Folio" value={params.lastFolio || 0} sub="Timbraje" icon={FileText} color="text-amber-600" />
                 <StatCard label="Estado Periodo" value={params.isClosed ? 'CERRADO' : 'ABIERTO'} sub="Seguridad" icon={params.isClosed ? Lock : Unlock} color={params.isClosed ? 'text-rose-600' : 'text-emerald-600'} />
               </div>
            </div>
          )}
          
          {/* Placeholder para otras pestañas */}
          {(activeTab === 'payroll' || activeTab === 'analytics' || activeTab === 'documents') && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale">
              <Calculator className="w-20 h-20 mb-6" />
              <h3 className="text-xl font-black uppercase italic">Módulo en Desarrollo</h3>
              <p className="text-xs font-medium mt-2">Continuando con la implementación del Capítulo 9 y 10.</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal Nueva Ficha */}
      {showEmpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden">
            <button onClick={() => setShowEmpModal(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            <h2 className="text-3xl font-black uppercase italic mb-8 tracking-tighter">Nueva Ficha Colaborador</h2>
            <form onSubmit={handleSaveEmployee} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">RUT</label>
                  <input required value={newEmpForm.rut} onChange={e => setNewEmpForm({...newEmpForm, rut: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="12.345.678-9" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Sueldo Base</label>
                  <input type="number" required value={newEmpForm.baseSalary} onChange={e => setNewEmpForm({...newEmpForm, baseSalary: Number(e.target.value)})} className="w-full px-6 py-4 bg-indigo-50 border-none rounded-2xl font-black text-indigo-700" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombres</label>
                <input required value={newEmpForm.firstName} onChange={e => setNewEmpForm({...newEmpForm, firstName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Apellidos</label>
                <input required value={newEmpForm.lastName} onChange={e => setNewEmpForm({...newEmpForm, lastName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Cargo</label>
                <input required value={newEmpForm.position} onChange={e => setNewEmpForm({...newEmpForm, position: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="Analista de Planta" />
              </div>
              <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all mt-4">Guardar en Nómina</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ProcessCard = ({ title, icon: Icon, desc, onClick, actionLabel }: any) => (
  <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all">
    <div>
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6"><Icon className="w-7 h-7" /></div>
      <h4 className="text-lg font-black uppercase italic mb-3">{title}</h4>
      <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed mb-8">{desc}</p>
    </div>
    <button onClick={onClick} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
       {actionLabel}
    </button>
  </div>
);

const UtilButton = ({ icon: Icon, label, onClick, color }: any) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
    <Icon className={`w-4 h-4 ${color}`} />
    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{label}</span>
  </button>
);

const SidebarItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>
    <Icon className="w-5 h-5" /> {label}
  </button>
);

const StatCard = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
    <div className={`w-12 h-12 rounded-2xl bg-slate-50 ${color} flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform`}><Icon className="w-6 h-6" /></div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <div className="flex items-baseline gap-2 mt-1">
      <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
      <span className="text-[9px] font-black text-slate-400 uppercase italic">{sub}</span>
    </div>
  </div>
);

const LoadingScreen = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
    <div className="w-20 h-20 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin mb-10"></div>
    <h2 className="text-xs font-black uppercase tracking-[0.5em] text-indigo-400 animate-pulse italic">Iniciando RemunPro...</h2>
  </div>
);

export default App;
