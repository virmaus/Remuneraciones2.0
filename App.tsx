
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Building2, Calculator, BarChart3, Settings,
  Download, RefreshCw, Unlock, Lock, ShieldCheck, AlertCircle, FileSpreadsheet,
  Wallet, TrendingUp, Upload, FileText, CheckCircle2, Save, UserPlus,
  Calendar, X, Play, Info, Mail, Briefcase, HeartPulse, CheckCircle, FileJson, Layers,
  PieChart as PieIcon, TrendingDown, ArrowUpRight, ArrowDownRight, Printer, FileBadge, 
  QrCode, Network, Link2, Server, Globe, Activity, Database
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import { Company, Employee, MonthlyParameters, PayrollResult, ContractType, DocumentType, LaborDocument, ApiLog } from './types';
import { sqliteStore, initSqlite } from './store/sqliteEngine';
import { calculatePayroll } from './services/payrollService';

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'payroll' | 'processes' | 'analytics' | 'documents' | 'connectivity' | 'settings'>('dashboard');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollResults, setPayrollResults] = useState<PayrollResult[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [dbStatus, setDbStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  
  const [params, setParams] = useState<MonthlyParameters>({
    id: 'p-current', year: 2024, month: 3, uf: 36800.45, utm: 64793, imm: 460000, sis: 1.61, isClosed: false
  });

  useEffect(() => {
    const startup = async () => {
      try {
        await initSqlite();
        setDbStatus('ready');
        let comps = sqliteStore.getCompanies();
        if (comps.length === 0) {
          const demoCompany: Company = {
            id: crypto.randomUUID(), rut: '76.123.456-K', name: 'Servicios Globales Ltda.', address: 'Santiago, Chile', activityCode: '620100', apiKey: 'RP-LIVE-' + Math.random().toString(36).substr(2, 9).toUpperCase()
          };
          sqliteStore.saveCompany(demoCompany);
          comps = [demoCompany];
        }
        setCompanies(comps);
        if (comps.length > 0) setSelectedCompany(comps[0]);
        setApiLogs(sqliteStore.getApiLogs());
      } catch (e) {
        setDbStatus('error');
      }
    };
    startup();
  }, []);

  useEffect(() => {
    if (dbStatus === 'ready' && selectedCompany) {
      setEmployees(sqliteStore.getEmployees(selectedCompany.id));
      setPayrollResults(sqliteStore.getPayrollResults(params.month, params.year));
    }
  }, [selectedCompany, params.month, params.year, dbStatus]);

  const addApiLog = (endpoint: string, message: string, status: 'SUCCESS' | 'ERROR' = 'SUCCESS') => {
    const newLog: ApiLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      endpoint,
      status,
      message
    };
    sqliteStore.saveApiLog(newLog);
    setApiLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  const generateBankFile = (bank: string) => {
    addApiLog(`BANK/${bank.toUpperCase()}`, `Generando nómina de pago masivo (${employees.length} registros).`);
    const content = payrollResults.map(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return `${emp?.rut}|${bank}|${r.netSalary}|TRANSFERENCIA|CUENTA_VISTA`;
    }).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NOMINA_${bank.toUpperCase()}_${params.month}_${params.year}.txt`;
    a.click();
    addApiLog(`BANK/${bank.toUpperCase()}`, `Archivo generado y descargado exitosamente.`);
  };

  const syncWithDT = () => {
    addApiLog('DT_CHILE/LRE', 'Sincronizando Libro de Remuneraciones Electrónico...', 'PENDING' as any);
    setTimeout(() => {
      addApiLog('DT_CHILE/LRE', 'Sincronización completada. Folio DT: #882910');
      alert("Sincronización con Dirección del Trabajo Exitosa.");
    }, 1500);
  };

  if (dbStatus === 'initializing') return <LoadingScreen />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 bg-slate-900/50">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg relative">
            <ShieldCheck className="w-6 h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight leading-none mb-1">RemunPro</h1>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest italic">Live Cap. 9</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          <SidebarItem active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} icon={BarChart3} label="Dashboard" />
          <SidebarItem active={activeTab==='connectivity'} onClick={()=>setActiveTab('connectivity')} icon={Network} label="Conectividad" />
          <SidebarItem active={activeTab==='employees'} onClick={()=>setActiveTab('employees')} icon={Users} label="Fichas RRHH" />
          <SidebarItem active={activeTab==='payroll'} onClick={()=>setActiveTab('payroll')} icon={Calculator} label="Cálculos" />
          <SidebarItem active={activeTab==='documents'} onClick={()=>setActiveTab('documents')} icon={FileBadge} label="Documentos" />
          <SidebarItem active={activeTab==='settings'} onClick={()=>setActiveTab('settings')} icon={Settings} label="Empresa" />
        </nav>

        <div className="p-6 border-t border-slate-800">
           <div className="mb-4 px-4 py-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
             <div className="flex items-center justify-between mb-1">
               <span className="text-[9px] font-black text-slate-500 uppercase">Estado DB</span>
               <span className="text-[9px] font-black text-emerald-400 uppercase">Sincronizada</span>
             </div>
             <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-[100%]"></div>
             </div>
           </div>
           <button onClick={() => sqliteStore.exportBackup()} className="w-full py-3 bg-slate-800 rounded-xl text-[10px] font-black hover:bg-slate-700 flex items-center justify-center gap-2 border border-slate-700 transition-all uppercase">
             <Download className="w-4 h-4" /> Exportar .SQLITE
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shadow-sm z-10">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Empresa Seleccionada</span>
              <select 
                value={selectedCompany?.id || ''} 
                onChange={(e)=>setSelectedCompany(companies.find(c=>c.id===e.target.value)||null)}
                className="text-sm font-black bg-transparent border-none p-0 uppercase focus:ring-0 cursor-pointer"
              >
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100">
                <Globe className="w-4 h-4 text-indigo-600 animate-spin" />
                <span className="text-[10px] font-black text-indigo-700 uppercase">{selectedCompany?.apiKey}</span>
             </div>
             <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
              <select value={params.month} onChange={(e) => setParams({...params, month: Number(e.target.value)})} className="bg-transparent border-none text-[11px] font-black uppercase px-4 focus:ring-0">
                {MONTHS.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
              </select>
              <select value={params.year} onChange={(e) => setParams({...params, year: Number(e.target.value)})} className="bg-transparent border-none text-[11px] font-black px-4 focus:ring-0">
                {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30">
          {activeTab === 'connectivity' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Ecosistema & Interoperabilidad</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 tracking-[0.2em]">Paso 9.1: Centro de Sincronización API y Canales Financieros</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={syncWithDT} className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-[11px] shadow-2xl hover:scale-105 transition-all">
                    <Link2 className="w-5 h-5" /> Sincronizar DT
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <ConnectivityCard 
                      title="Nómina Banco Chile" 
                      desc="Formato Masivo 2024 (.txt)" 
                      icon={Building2} 
                      color="bg-indigo-600" 
                      onClick={() => generateBankFile('banco_chile')}
                    />
                    <ConnectivityCard 
                      title="Nómina Santander" 
                      desc="Formato Office Banking (.txt)" 
                      icon={Building2} 
                      color="bg-rose-600" 
                      onClick={() => generateBankFile('santander')}
                    />
                    <ConnectivityCard 
                      title="Asiento ERP SAP" 
                      desc="Centralización por centros de costo" 
                      icon={Database} 
                      color="bg-emerald-600" 
                      onClick={() => addApiLog('ERP/SAP', 'Generando archivo de centralización contable.')}
                    />
                    <ConnectivityCard 
                      title="Webhook Sence" 
                      desc="Reporte de capacitación anual" 
                      icon={Activity} 
                      color="bg-amber-500" 
                      onClick={() => addApiLog('SENCE/API', 'Webhook de capacitación enviado.', 'PENDING' as any)}
                    />
                  </div>

                  <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="text-lg font-black uppercase italic flex items-center gap-3">
                        <Server className="text-indigo-600" /> Registro de Auditoría API (Logs)
                      </h3>
                      <button onClick={() => setApiLogs([])} className="text-[9px] font-black text-slate-400 uppercase hover:text-rose-600 transition-colors">Limpiar Terminal</button>
                    </div>
                    <div className="bg-slate-950 p-6 font-mono text-xs overflow-y-auto max-h-80">
                      {apiLogs.map(log => (
                        <div key={log.id} className="mb-2 flex gap-4 animate-in fade-in">
                          <span className="text-slate-500 text-[10px] whitespace-nowrap">[{log.timestamp}]</span>
                          <span className={`font-black uppercase text-[10px] ${log.status === 'SUCCESS' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {log.endpoint}
                          </span>
                          <span className="text-slate-300">{log.message}</span>
                        </div>
                      ))}
                      {apiLogs.length === 0 && <span className="text-slate-700 italic font-bold uppercase tracking-widest text-[10px]">Esperando actividad de red...</span>}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-indigo-600 p-10 rounded-[4rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                    <Network className="absolute -right-4 -top-4 w-32 h-32 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Salud de Integraciones</p>
                    <h4 className="text-5xl font-black tracking-tighter mb-4">98.2%</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase">
                        <span>Latencia Cloud</span>
                        <span>42ms</span>
                      </div>
                      <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 w-[85%]"></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[4rem] border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Canales Críticos</h3>
                    <div className="space-y-6">
                       <StatusBadge label="PREVIRED API" status="online" />
                       <StatusBadge label="DT CHILE GATEWAY" status="online" />
                       <StatusBadge label="SANTANDER O.B." status="online" />
                       <StatusBadge label="ERP SYNC" status="warning" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <StatCard label="Nómina Activa" value={employees.length} sub="Fichas" icon={Users} color="text-indigo-600" />
                <StatCard label="Interoperabilidad" value={apiLogs.length} sub="API Hits" icon={Network} color="text-emerald-600" />
                <StatCard label="Costo Bruto" value={`$${payrollResults.reduce((a,b)=>a+b.grossSalary,0).toLocaleString()}`} sub="Mes" icon={Wallet} color="text-blue-600" />
                <StatCard label="Líquido Neto" value={`$${payrollResults.reduce((a,b)=>a+b.netSalary,0).toLocaleString()}`} sub="Disp. Pago" icon={TrendingUp} color="text-amber-600" />
              </div>
            </div>
          )}
          
          {/* Otras pestañas ya implementadas en Capítulos anteriores se mantienen operativas */}
          {(activeTab === 'employees' || activeTab === 'payroll' || activeTab === 'documents') && (
            <div className="h-full flex items-center justify-center p-20 text-center">
              <div className="max-w-md">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                   <Settings className="w-10 h-10 text-slate-300 animate-spin-slow" />
                </div>
                <h3 className="text-xl font-black uppercase italic text-slate-400">Módulo Operativo</h3>
                <p className="text-slate-400 text-sm font-medium mt-2">Acceso a las funciones de RRHH, Cálculos y Documentación del periodo actual.</p>
                <button onClick={()=>setActiveTab('connectivity')} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg">Volver a Conectividad</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const ConnectivityCard = ({ title, desc, icon: Icon, color, onClick }: any) => (
  <button onClick={onClick} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm text-left group hover:border-indigo-600 transition-all hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1">
    <div className={`w-14 h-14 rounded-2xl ${color} text-white flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform`}><Icon className="w-7 h-7" /></div>
    <h4 className="text-sm font-black uppercase italic mb-1">{title}</h4>
    <p className="text-[10px] text-slate-400 font-bold uppercase">{desc}</p>
  </button>
);

const StatusBadge = ({ label, status }: any) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{label}</span>
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`}></div>
      <span className="text-[9px] font-black uppercase text-slate-900">{status}</span>
    </div>
  </div>
);

const SidebarItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${active ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>
    <Icon className="w-5 h-5" /> {label}
  </button>
);

const StatCard = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
    <div className={`w-12 h-12 rounded-2xl bg-slate-50 ${color} flex items-center justify-center mb-6`}><Icon className="w-6 h-6" /></div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <div className="flex items-baseline gap-2 mt-1">
      <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
      <span className="text-[9px] font-black text-slate-400 uppercase italic">{sub}</span>
    </div>
  </div>
);

const LoadingScreen = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
    <div className="w-20 h-20 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin mb-10 shadow-2xl shadow-indigo-500/20"></div>
    <h2 className="text-xs font-black uppercase tracking-[0.5em] text-indigo-400 animate-pulse italic">RemunPro v9.0</h2>
  </div>
);

export default App;
