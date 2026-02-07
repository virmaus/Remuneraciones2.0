
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Building2, Calculator, BarChart3, Settings,
  Download, RefreshCw, Unlock, Lock, ShieldCheck, AlertCircle, FileSpreadsheet,
  Wallet, TrendingUp, Upload, FileText, CheckCircle2, Save, UserPlus,
  Calendar, X, Play, Info, Mail, Briefcase, HeartPulse, CheckCircle
} from 'lucide-react';
import { Company, Employee, MonthlyParameters, PayrollResult, ContractType, TerminationReason } from './types';
import { sqliteStore, initSqlite } from './store/sqliteEngine';
import { calculatePayroll } from './services/payrollService';

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'payroll' | 'processes' | 'settings'>('dashboard');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollResults, setPayrollResults] = useState<PayrollResult[]>([]);
  const [dbStatus, setDbStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  
  // Modales y Formularios
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [empForm, setEmpForm] = useState<Partial<Employee>>({ 
    rut: '', firstName: '', lastName: '', email: '', baseSalary: 460000, 
    position: '', costCenterId: 'ADMIN', startDate: new Date().toISOString().split('T')[0],
    contractType: ContractType.INDEFINITE, afpName: 'Provida', healthName: 'Fonasa', isActive: true
  });
  const [newCompany, setNewCompany] = useState<Partial<Company>>({ rut: '', name: '', address: '', activityCode: '' });
  
  // Procesos State
  const [procTab, setProcTab] = useState<'accounting' | 'import' | 'termination' | 'closing'>('accounting');
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
        const comps = sqliteStore.getCompanies();
        setCompanies(comps);
        if (comps.length > 0) setSelectedCompany(comps[0]);
      } catch (e) {
        setDbStatus('error');
      }
    };
    startup();
  }, []);

  // Cargar parámetros y datos cuando cambia mes/año
  useEffect(() => {
    const loadMonthlyData = () => {
      const storedParams = sqliteStore.getMonthlyParameters(params.month, params.year);
      if (storedParams) {
        setParams(storedParams);
      } else {
        // Si no existe, creamos parámetros por defecto para el periodo
        const defaultParams = { ...params, id: `${params.year}-${params.month}`, isClosed: false };
        setParams(defaultParams);
      }

      if (selectedCompany) {
        const emps = sqliteStore.getEmployees(selectedCompany.id);
        setEmployees(emps);
        setPayrollResults(sqliteStore.getPayrollResults(params.month, params.year));
      }
    };
    
    if (dbStatus === 'ready') loadMonthlyData();
  }, [selectedCompany, params.month, params.year, dbStatus]);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    if (params.isClosed) {
      alert("No se pueden agregar colaboradores a un mes cerrado.");
      return;
    }
    
    const emp: Employee = {
      ...empForm as Employee,
      id: crypto.randomUUID(),
      companyId: selectedCompany.id,
      isActive: true
    };
    
    sqliteStore.saveEmployee(emp);
    setEmployees(sqliteStore.getEmployees(selectedCompany.id));
    setShowEmpModal(false);
    alert("Colaborador registrado correctamente.");
  };

  const processMonthlyPayroll = () => {
    if (!selectedCompany || employees.length === 0) return;
    if (params.isClosed) {
      alert("Este mes ya se encuentra cerrado. No se permiten nuevos cálculos.");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      const results: PayrollResult[] = employees.filter(e => e.isActive).map(emp => {
        const res = calculatePayroll(emp, params);
        sqliteStore.savePayrollResult(res);
        return res;
      });
      setPayrollResults(results);
      setIsProcessing(false);
      alert(`Se han procesado ${results.length} liquidaciones.`);
    }, 800);
  };

  const handleCloseMonth = () => {
    if (params.isClosed) return;
    if (payrollResults.length < employees.filter(e => e.isActive).length) {
      if (!confirm("Aún faltan trabajadores por calcular. ¿Desea cerrar el mes de todas formas?")) return;
    }

    const updatedParams = { ...params, isClosed: true };
    sqliteStore.saveMonthlyParameters(updatedParams);
    setParams(updatedParams);
    alert(`Mes de ${MONTHS[params.month-1]} ${params.year} cerrado exitosamente.`);
  };

  const handleOpenMonth = () => {
    if (!params.isClosed) return;
    if (!confirm("¿Está seguro de que desea reabrir este mes? Esto permitirá modificar cálculos existentes.")) return;
    
    const updatedParams = { ...params, isClosed: false };
    sqliteStore.saveMonthlyParameters(updatedParams);
    setParams(updatedParams);
  };

  if (dbStatus === 'initializing') return <LoadingScreen />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 bg-slate-900/50">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight leading-none mb-1">RemunPro</h1>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest italic">v4.6.1 Final</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          <SidebarItem active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} icon={BarChart3} label="Dashboard" />
          <SidebarItem active={activeTab==='employees'} onClick={()=>setActiveTab('employees')} icon={Users} label="Fichas RRHH" />
          <SidebarItem active={activeTab==='payroll'} onClick={()=>setActiveTab('payroll')} icon={Calculator} label="Movimientos" />
          <SidebarItem active={activeTab==='processes'} onClick={()=>setActiveTab('processes')} icon={Settings} label="Procesos" />
          <SidebarItem active={activeTab==='settings'} onClick={()=>setActiveTab('settings')} icon={Building2} label="Configuración" />
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-950/20">
           <button onClick={() => sqliteStore.exportBackup()} className="w-full py-3 bg-slate-800 rounded-xl text-[10px] font-black hover:bg-slate-700 flex items-center justify-center gap-2 border border-slate-700 transition-all uppercase tracking-widest">
             <Download className="w-4 h-4" /> Exportar .SQLITE
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shadow-sm z-10">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unidad de Negocio</span>
               <select 
                value={selectedCompany?.id || ''} 
                onChange={(e)=>setSelectedCompany(companies.find(c=>c.id===e.target.value)||null)}
                className="text-sm font-black bg-slate-100 border-none rounded-xl px-4 py-2 uppercase cursor-pointer focus:ring-2 focus:ring-indigo-500"
              >
                {companies.length === 0 && <option value="">SIN EMPRESA</option>}
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
              <select value={params.month} onChange={(e) => setParams({...params, month: Number(e.target.value)})} className="bg-transparent border-none text-[11px] font-black uppercase px-4 cursor-pointer focus:ring-0">
                {MONTHS.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
              </select>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              <select value={params.year} onChange={(e) => setParams({...params, year: Number(e.target.value)})} className="bg-transparent border-none text-[11px] font-black px-4 cursor-pointer focus:ring-0">
                {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${params.isClosed ? 'bg-rose-50 border-rose-100 text-rose-700 shadow-sm' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
              {params.isClosed ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-widest">{params.isClosed ? 'Periodo Cerrado' : 'Periodo Abierto'}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30">
          {companies.length === 0 && activeTab !== 'settings' ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto animate-in fade-in duration-500">
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-8 border-4 border-white shadow-xl animate-bounce"><AlertCircle className="w-12 h-12" /></div>
              <h2 className="text-3xl font-black uppercase mb-4 italic tracking-tighter">Motor no Iniciado</h2>
              <p className="text-slate-500 mb-10 leading-relaxed font-medium">Debe registrar una empresa en el panel de configuración para habilitar el procesamiento legal.</p>
              <button onClick={() => setActiveTab('settings')} className="px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase shadow-2xl hover:scale-105 transition-transform">Crear Entidad Ahora</button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <StatCard label="Nómina Activa" value={employees.filter(e => e.isActive).length} sub="Personas" icon={Users} color="text-indigo-600" />
                    <StatCard label="Costo Empresa" value={`$${payrollResults.reduce((a,b)=>a+b.grossSalary,0).toLocaleString()}`} sub="Haberes Brutos" icon={Wallet} color="text-emerald-600" />
                    <StatCard label="Gratificación" value={`$${payrollResults.reduce((a,b)=>a+b.legalGratification,0).toLocaleString()}`} sub="Art. 47" icon={TrendingUp} color="text-blue-600" />
                    <StatCard label="Imponibilidad" value={`$${payrollResults.reduce((a,b)=>a+b.taxableSalary,0).toLocaleString()}`} sub="Base Legal" icon={ShieldCheck} color="text-amber-600" />
                  </div>

                  {params.isClosed && (
                    <div className="bg-emerald-600 p-10 rounded-[3rem] text-white flex items-center justify-between shadow-xl shadow-emerald-100">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center"><CheckCircle className="w-10 h-10" /></div>
                        <div>
                          <h3 className="text-2xl font-black uppercase tracking-tighter italic">Proceso Mensual Finalizado</h3>
                          <p className="text-emerald-100 text-sm font-medium">Todas las liquidaciones de {MONTHS[params.month-1]} han sido contabilizadas y bloqueadas.</p>
                        </div>
                      </div>
                      <button onClick={handleOpenMonth} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest border border-white/20 transition-all">Reabrir Periodo</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'employees' && (
                 <div className="space-y-8 animate-in slide-in-from-bottom-6">
                   <div className="flex justify-between items-end">
                     <div>
                       <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Colaboradores</h2>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Maestro de Personal Permanente</p>
                     </div>
                     <button 
                        onClick={() => params.isClosed ? alert("Periodo cerrado") : setShowEmpModal(true)} 
                        disabled={params.isClosed}
                        className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black uppercase text-[11px] shadow-2xl transition-all ${params.isClosed ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                     >
                       <UserPlus className="w-5 h-5" /> Nueva Ficha
                     </button>
                   </div>
                   
                   <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                     <table className="w-full text-left">
                       <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                         <tr>
                           <th className="px-10 py-6">Trabajador / RUT</th>
                           <th className="px-10 py-6 text-center">Contrato</th>
                           <th className="px-10 py-6">Fecha Ingreso</th>
                           <th className="px-10 py-6 text-right">Sueldo Base</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                         {employees.map(emp => (
                           <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                             <td className="px-10 py-6">
                               <div className="font-black uppercase text-sm group-hover:text-indigo-600">{emp.firstName} {emp.lastName}</div>
                               <div className="text-[10px] text-slate-400 font-bold tracking-tighter">{emp.rut}</div>
                             </td>
                             <td className="px-10 py-6 text-center">
                               <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase">{emp.contractType}</span>
                             </td>
                             <td className="px-10 py-6 text-xs font-bold text-slate-500">{emp.startDate}</td>
                             <td className="px-10 py-6 text-right font-black text-slate-900">${emp.baseSalary.toLocaleString()}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
              )}

              {activeTab === 'payroll' && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-4xl font-black uppercase italic leading-none">Movimientos</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 italic">Procesamiento de Liquidaciones - {MONTHS[params.month-1]}</p>
                    </div>
                    {!params.isClosed ? (
                      <button onClick={processMonthlyPayroll} disabled={isProcessing} className="px-10 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-[12px] shadow-2xl hover:bg-emerald-700 transition-all flex items-center gap-3">
                        {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                        Ejecutar Cálculo Art. 47
                      </button>
                    ) : (
                      <div className="px-10 py-5 bg-rose-600 text-white rounded-[1.5rem] font-black uppercase text-[12px] shadow-2xl flex items-center gap-3">
                        <Lock className="w-5 h-5" /> Mes Bloqueado
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b tracking-widest">
                        <tr>
                          <th className="px-10 py-6">Colaborador</th>
                          <th className="px-10 py-6 text-right">Haberes</th>
                          <th className="px-10 py-6 text-right">Descuentos</th>
                          <th className="px-10 py-6 text-right">Líquido a Pago</th>
                          <th className="px-10 py-6 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {employees.map(emp => {
                          const result = payrollResults.find(r => r.employeeId === emp.id);
                          return (
                            <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-10 py-6 font-black uppercase text-sm">{emp.firstName} {emp.lastName}</td>
                              <td className="px-10 py-6 text-right font-bold text-slate-600">{result ? `$${result.grossSalary.toLocaleString()}` : '-'}</td>
                              <td className="px-10 py-6 text-right text-rose-500 font-bold">{result ? `$${(result.afpAmount + result.healthAmount + result.taxAmount).toLocaleString()}` : '-'}</td>
                              <td className="px-10 py-6 text-right font-black text-emerald-600 text-lg">{result ? `$${result.netSalary.toLocaleString()}` : '-'}</td>
                              <td className="px-10 py-6 text-center">
                                {result ? (
                                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase flex items-center justify-center gap-1 w-fit mx-auto">
                                    <CheckCircle2 className="w-3 h-3" /> OK
                                  </span>
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
                <div className="space-y-8 animate-in slide-in-from-bottom-6">
                  <div className="flex gap-4 p-2 bg-slate-200/50 w-fit rounded-[1.5rem]">
                    {[
                      { id: 'accounting', label: 'Centralización', icon: FileText }, 
                      { id: 'termination', label: 'Finiquitos', icon: X },
                      { id: 'closing', label: 'Cierre Mensual', icon: Lock }
                    ].map(t => (
                      <button key={t.id} onClick={() => setProcTab(t.id as any)} className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${procTab === t.id ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>
                        <t.icon className="w-4 h-4" /> {t.label}
                      </button>
                    ))}
                  </div>

                  {procTab === 'closing' && (
                    <div className="max-w-3xl mx-auto space-y-8">
                      <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm text-center">
                        <div className={`w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center border-4 border-white shadow-xl ${params.isClosed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {params.isClosed ? <Lock className="w-10 h-10" /> : <Unlock className="w-10 h-10" />}
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-4">Control de Periodo: {MONTHS[params.month-1]} {params.year}</h2>
                        <p className="text-slate-500 font-medium mb-12">El cierre de mes bloquea la edición de liquidaciones, genera folios permanentes y habilita el informe de centralización contable final.</p>
                        
                        {!params.isClosed ? (
                          <button 
                            onClick={handleCloseMonth}
                            className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4"
                          >
                            <Lock className="w-6 h-6" /> Cerrar Mes Ahora
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-emerald-800 font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                              <CheckCircle className="w-5 h-5" /> Este periodo ya se encuentra procesado y cerrado
                            </div>
                            <button 
                              onClick={handleOpenMonth}
                              className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-rose-600 transition-colors"
                            >
                              Solicitar Reapertura de Periodo
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {procTab === 'accounting' && (
                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                       <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                         <div>
                           <h2 className="text-2xl font-black uppercase italic tracking-tighter">Centralización Contable</h2>
                           <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Sincronización para ERP - {MONTHS[params.month-1]}</p>
                         </div>
                         <div className="flex gap-4">
                           <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all">Vista Previa</button>
                           <button className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${params.isClosed ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Contabilizar</button>
                         </div>
                       </div>
                       {!params.isClosed && (
                         <div className="p-4 bg-amber-50 text-amber-700 text-[10px] font-black uppercase text-center border-b border-amber-100">
                           Aviso: Debe cerrar el mes para habilitar la contabilización definitiva.
                         </div>
                       )}
                       <table className="w-full text-left">
                         <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b">
                           <tr><th className="px-10 py-6">Cuenta</th><th className="px-10 py-6">Descripción</th><th className="px-10 py-6 text-right">Debe</th><th className="px-10 py-6 text-right">Haber</th></tr>
                         </thead>
                         <tbody className="divide-y">
                            <tr className="bg-slate-50/20"><td className="px-10 py-6 font-mono text-xs text-indigo-600 font-bold">510101</td><td className="px-10 py-6 text-xs font-black uppercase">Sueldos y Salarios</td><td className="px-10 py-6 text-right font-black">${payrollResults.reduce((a,b)=>a+b.grossSalary,0).toLocaleString()}</td><td className="px-10 py-6 text-right font-black">-</td></tr>
                            <tr className="bg-slate-50/20"><td className="px-10 py-6 font-mono text-xs text-indigo-600 font-bold">210301</td><td className="px-10 py-6 text-xs font-black uppercase">Remun. por Pagar</td><td className="px-10 py-6 text-right font-black">-</td><td className="px-10 py-6 text-right font-black">${payrollResults.reduce((a,b)=>a+b.netSalary,0).toLocaleString()}</td></tr>
                         </tbody>
                       </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showEmpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95 relative">
            <button onClick={() => setShowEmpModal(false)} className="absolute top-10 right-10 p-4 hover:bg-slate-100 rounded-full transition-all"><X className="w-8 h-8" /></button>
            <div className="mb-8">
              <h2 className="text-4xl font-black uppercase tracking-tighter italic">Ficha RRHH 4.4.1</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 tracking-[0.2em]">Configuración del Colaborador</p>
            </div>
            <form onSubmit={handleAddEmployee} className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">RUT Identificador</label>
                <input required value={empForm.rut} onChange={e=>setEmpForm({...empForm, rut: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" placeholder="12.345.678-9" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Fecha Ingreso</label>
                <input type="date" required value={empForm.startDate} onChange={e=>setEmpForm({...empForm, startDate: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nombres</label>
                <input required value={empForm.firstName} onChange={e=>setEmpForm({...empForm, firstName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Apellidos</label>
                <input required value={empForm.lastName} onChange={e=>setEmpForm({...empForm, lastName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1"><Briefcase className="w-2 h-2 inline" /> Contrato</label>
                <select value={empForm.contractType} onChange={e=>setEmpForm({...empForm, contractType: e.target.value as any})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500">
                  {Object.values(ContractType).map(t=>(<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1"><HeartPulse className="w-2 h-2 inline" /> Salud</label>
                <select value={empForm.healthName} onChange={e=>setEmpForm({...empForm, healthName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500">
                  <option value="Fonasa">Fonasa</option>
                  <option value="Colmena">Isapre Colmena</option>
                  <option value="Consalud">Isapre Consalud</option>
                  <option value="Cruz Blanca">Isapre Cruz Blanca</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Sueldo Base Mensual</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-indigo-300 font-mono">$</span>
                  <input type="number" required value={empForm.baseSalary} onChange={e=>setEmpForm({...empForm, baseSalary: Number(e.target.value)})} className="w-full px-12 py-5 bg-indigo-50 border-none rounded-[1.5rem] font-black text-2xl text-indigo-700" />
                </div>
              </div>
              <button type="submit" className="col-span-2 py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 mt-4">
                <UserPlus className="w-6 h-6" /> Guardar en Base de Datos
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${active ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
    <Icon className="w-5 h-5" /> {label}
  </button>
);

const StatCard = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
    <Icon className={`absolute -right-4 -top-4 w-24 h-24 ${color} opacity-5 group-hover:scale-110 transition-transform`} />
    <div className={`w-12 h-12 rounded-2xl bg-slate-50 ${color} flex items-center justify-center mb-6 shadow-sm`}><Icon className="w-6 h-6" /></div>
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
    <h2 className="text-xs font-black uppercase tracking-[0.5em] text-indigo-400 animate-pulse italic">RemunPro Analytics v4.6.1</h2>
  </div>
);

export default App;
