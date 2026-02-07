
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Building2, Calculator, BarChart3, Settings, Database,
  Plus, Download, RefreshCw, Lock, Unlock,
  ShieldCheck, AlertCircle, FileSpreadsheet,
  Wallet, TrendingUp, Upload, FileText, CheckCircle2, Save, UserPlus,
  Calendar, X, Play, Info, Mail
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
  const [empForm, setEmpForm] = useState<Partial<Employee>>({ 
    rut: '', firstName: '', lastName: '', email: '', baseSalary: 460000, position: '', costCenterId: 'ADMIN' 
  });
  const [newCompany, setNewCompany] = useState<Partial<Company>>({ rut: '', name: '', address: '', activityCode: '' });
  
  // Procesos State
  const [procTab, setProcTab] = useState<'accounting' | 'increments' | 'import'>('accounting');
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

  useEffect(() => {
    if (selectedCompany) {
      const emps = sqliteStore.getEmployees(selectedCompany.id);
      setEmployees(emps);
      setPayrollResults(sqliteStore.getPayrollResults(params.month, params.year));
    }
  }, [selectedCompany, params.month, params.year]);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) {
      alert("Seleccione una empresa primero");
      return;
    }
    
    const emp: Employee = {
      ...empForm as Employee,
      id: crypto.randomUUID(),
      companyId: selectedCompany.id,
      email: empForm.email || ''
    };
    
    sqliteStore.saveEmployee(emp);
    const updated = sqliteStore.getEmployees(selectedCompany.id);
    setEmployees(updated);
    setShowEmpModal(false);
    setEmpForm({ rut: '', firstName: '', lastName: '', email: '', baseSalary: 460000, position: '', costCenterId: 'ADMIN' });
    alert("Colaborador registrado correctamente.");
  };

  const processMonthlyPayroll = () => {
    if (!selectedCompany || employees.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      const results: PayrollResult[] = employees.map(emp => {
        const res = calculatePayroll(emp, params);
        sqliteStore.savePayrollResult(res);
        return res;
      });
      setPayrollResults(results);
      setIsProcessing(false);
      alert(`Se han procesado ${results.length} liquidaciones.`);
    }, 800);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompany) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(r => r.trim() !== '');
      const dataRows = rows.slice(1); // Saltar cabecera
      
      dataRows.forEach(row => {
        const parts = row.split(',').map(p => p.trim());
        if (parts.length >= 4) {
          const [rut, firstName, lastName, salary, position] = parts;
          sqliteStore.saveEmployee({
            id: crypto.randomUUID(),
            companyId: selectedCompany!.id,
            rut, firstName, lastName,
            email: '',
            baseSalary: Number(salary) || 460000,
            position: position || 'Operario',
            costCenterId: 'ADMIN'
          });
        }
      });
      setEmployees(sqliteStore.getEmployees(selectedCompany!.id));
      alert(`Importación finalizada. Filas procesadas: ${dataRows.length}`);
    };
    reader.readAsText(file);
  };

  const generateAccountingVoucher = (): AccountingItem[] => {
    const totalGross = payrollResults.reduce((a, b) => a + (b.grossSalary || 0), 0);
    const totalAfp = payrollResults.reduce((a, b) => a + (b.afpAmount || 0), 0);
    const totalHealth = payrollResults.reduce((a, b) => a + (b.healthAmount || 0), 0);
    const totalNet = payrollResults.reduce((a, b) => a + (b.netSalary || 0), 0);

    return [
      { accountCode: '510101', accountName: 'Sueldos y Salarios', debit: totalGross, credit: 0, costCenter: 'ADMIN' },
      { accountCode: '210501', accountName: 'AFP por Pagar', debit: 0, credit: totalAfp, costCenter: 'GENERAL' },
      { accountCode: '210502', accountName: 'Isapre por Pagar', debit: 0, credit: totalHealth, costCenter: 'GENERAL' },
      { accountCode: '210301', accountName: 'Remuneraciones por Pagar', debit: 0, credit: totalNet, costCenter: 'GENERAL' },
    ];
  };

  if (dbStatus === 'initializing') return <LoadingScreen />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* Sidebar con estética Capítulo 9 */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 bg-slate-900/50">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight leading-none">RemunPro</h1>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">v4.4.1 Offline</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          <SidebarItem active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} icon={BarChart3} label="Dashboard" />
          <SidebarItem active={activeTab==='employees'} onClick={()=>setActiveTab('employees')} icon={Users} label="Fichas RRHH" />
          <SidebarItem active={activeTab==='payroll'} onClick={()=>setActiveTab('payroll')} icon={Calculator} label="Movimientos" />
          <SidebarItem active={activeTab==='processes'} onClick={()=>setActiveTab('processes')} icon={Settings} label="Procesos" />
          <SidebarItem active={activeTab==='settings'} onClick={()=>setActiveTab('settings')} icon={Building2} label="Configuración" />
        </nav>

        <div className="p-6 bg-slate-950/50 border-t border-slate-800">
           <button onClick={() => sqliteStore.exportBackup()} className="w-full py-3 bg-slate-800 rounded-xl text-[10px] font-black hover:bg-slate-700 flex items-center justify-center gap-2 border border-slate-700 transition-all uppercase tracking-widest">
             <Download className="w-4 h-4" /> Exportar .SQLITE
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Dinámico */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shadow-sm z-10">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Empresa Activa</span>
              <select 
                value={selectedCompany?.id || ''} 
                onChange={(e)=>setSelectedCompany(companies.find(c=>c.id===e.target.value)||null)}
                className="text-sm font-black bg-slate-100 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 uppercase cursor-pointer"
              >
                {companies.length === 0 && <option value="">SIN REGISTROS</option>}
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 rounded-2xl p-1.5 border border-slate-200">
              <select value={params.month} onChange={(e) => setParams({...params, month: Number(e.target.value)})} className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest focus:ring-0 px-4 cursor-pointer">
                {MONTHS.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
              </select>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              <select value={params.year} onChange={(e) => setParams({...params, year: Number(e.target.value)})} className="bg-transparent border-none text-[11px] font-black focus:ring-0 px-4 cursor-pointer">
                {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2.5 rounded-2xl border border-indigo-100 text-indigo-700">
              <Unlock className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Periodo Abierto</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30">
          {companies.length === 0 && activeTab !== 'settings' ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto animate-in fade-in zoom-in">
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-8 border-4 border-white shadow-xl">
                <AlertCircle className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 italic">Sistema Vacío</h2>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed">Para habilitar el motor de remuneraciones, primero debe registrar una empresa en el módulo de configuración.</p>
              <button onClick={() => setActiveTab('settings')} className="px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transform hover:-translate-y-1 transition-all">
                Configurar Empresa Inicial
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <StatCard label="Nómina Total" value={employees.length} sub="Personas" icon={Users} color="text-indigo-600" />
                    <StatCard label="Sueldo Neto" value={`$${payrollResults.reduce((a,b)=>a+b.netSalary,0).toLocaleString()}`} sub="Total CLP" icon={Wallet} color="text-emerald-600" />
                    <StatCard label="Imponibles" value={`$${payrollResults.reduce((a,b)=>a+b.taxableSalary,0).toLocaleString()}`} sub="Base Legal" icon={TrendingUp} color="text-blue-600" />
                    <StatCard label="Calculados" value={payrollResults.length} sub="Registros" icon={CheckCircle2} color="text-amber-600" />
                  </div>
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter italic">Resumen del Periodo</h3>
                      <p className="text-slate-400 text-sm font-medium">Estado de las liquidaciones para {MONTHS[params.month-1]} {params.year}</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'employees' && (
                 <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
                   <div className="flex justify-between items-end">
                     <div>
                       <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Fichas RRHH</h2>
                       <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mt-3">Administración de Legajos de Personal</p>
                     </div>
                     <button onClick={() => setShowEmpModal(true)} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-95">
                       <UserPlus className="w-5 h-5" /> Nuevo Colaborador
                     </button>
                   </div>
                   
                   <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                     <table className="w-full text-left">
                       <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                         <tr>
                           <th className="px-10 py-6">RUT / Identificador</th>
                           <th className="px-10 py-6">Nombres y Apellidos</th>
                           <th className="px-10 py-6">Posición</th>
                           <th className="px-10 py-6 text-right">Sueldo Base</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                         {employees.map(emp => (
                           <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                             <td className="px-10 py-6 font-mono text-xs text-indigo-600 font-bold">{emp.rut}</td>
                             <td className="px-10 py-6">
                               <div className="font-black uppercase text-sm group-hover:text-indigo-600 transition-colors">{emp.firstName} {emp.lastName}</div>
                               <div className="text-[10px] text-slate-400 font-bold">{emp.email || 'SIN EMAIL'}</div>
                             </td>
                             <td className="px-10 py-6">
                               <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">{emp.position}</span>
                             </td>
                             <td className="px-10 py-6 text-right font-black text-slate-900">${emp.baseSalary.toLocaleString()}</td>
                           </tr>
                         ))}
                         {employees.length === 0 && (
                           <tr>
                             <td colSpan={4} className="p-20 text-center">
                               <Info className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                               <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Sin trabajadores registrados en esta empresa</p>
                             </td>
                           </tr>
                         )}
                       </tbody>
                     </table>
                   </div>
                 </div>
              )}

              {activeTab === 'payroll' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Movimientos</h2>
                      <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mt-3">Procesamiento de Liquidaciones - {MONTHS[params.month-1]}</p>
                    </div>
                    <button 
                      onClick={processMonthlyPayroll} 
                      disabled={isProcessing || employees.length === 0}
                      className="flex items-center gap-3 px-10 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-[12px] tracking-widest shadow-2xl shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50 transition-all"
                    >
                      {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                      Ejecutar Cálculo Masivo
                    </button>
                  </div>

                  <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                        <tr>
                          <th className="px-10 py-6">Colaborador</th>
                          <th className="px-10 py-6 text-right">Total Haberes</th>
                          <th className="px-10 py-6 text-right">Leyes Sociales</th>
                          <th className="px-10 py-6 text-right">Líquido a Pago</th>
                          <th className="px-10 py-6 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {employees.map(emp => {
                          const result = payrollResults.find(r => r.employeeId === emp.id);
                          return (
                            <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-10 py-6">
                                <p className="font-black uppercase text-sm">{emp.firstName} {emp.lastName}</p>
                                <p className="text-[9px] text-slate-400 font-black tracking-widest">{emp.rut}</p>
                              </td>
                              <td className="px-10 py-6 text-right font-bold text-slate-600">{result ? `$${result.grossSalary.toLocaleString()}` : '-'}</td>
                              <td className="px-10 py-6 text-right text-rose-500 font-bold">{result ? `$${(result.afpAmount + result.healthAmount).toLocaleString()}` : '-'}</td>
                              <td className="px-10 py-6 text-right font-black text-emerald-600 text-lg">{result ? `$${result.netSalary.toLocaleString()}` : '-'}</td>
                              <td className="px-10 py-6 text-center">
                                {result ? (
                                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-[9px] font-black uppercase">Calculado</span>
                                  </div>
                                ) : (
                                  <span className="px-4 py-1.5 bg-slate-100 text-slate-400 rounded-full text-[9px] font-black uppercase">Pendiente</span>
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
                <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-6">
                  <div className="flex gap-4 p-2 bg-slate-200/50 w-fit rounded-[1.5rem]">
                    {[
                      { id: 'accounting', label: 'Voucher Contable', icon: FileText },
                      { id: 'import', label: 'Importación Masiva', icon: Upload }
                    ].map(t => (
                      <button key={t.id} onClick={() => setProcTab(t.id as any)} className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${procTab === t.id ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>
                        <t.icon className="w-4 h-4" /> {t.label}
                      </button>
                    ))}
                  </div>

                  {procTab === 'import' && (
                    <div className="bg-white p-20 rounded-[4rem] border border-slate-200 shadow-sm text-center max-w-3xl mx-auto border-dashed border-2">
                      <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-xl"><FileSpreadsheet className="w-12 h-12" /></div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 italic">Carga Batch de Personal</h2>
                      <p className="text-slate-400 font-medium mb-12">Sincronice miles de fichas mediante archivos CSV estándar.<br/>Formato: <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-indigo-600">rut, nombre, apellido, sueldo, cargo</code></p>
                      <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
                      <button onClick={() => fileInputRef.current?.click()} className="px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 flex items-center gap-4 mx-auto hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95">
                        <Upload className="w-6 h-6" /> Seleccionar CSV Local
                      </button>
                    </div>
                  )}

                  {procTab === 'accounting' && (
                    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
                       <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                         <div>
                           <h2 className="text-2xl font-black uppercase tracking-tighter italic">Comprobante de Centralización</h2>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronización para ERP Contable - {MONTHS[params.month-1]}</p>
                         </div>
                         <div className="flex gap-4">
                           <button className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Generar PDF</button>
                           <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">Contabilizar Ahora</button>
                         </div>
                       </div>
                       <table className="w-full text-left">
                         <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                           <tr><th className="px-10 py-6">Código de Cuenta</th><th className="px-10 py-6">Descripción</th><th className="px-10 py-6 text-right">Debe</th><th className="px-10 py-6 text-right">Haber</th></tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                           {generateAccountingVoucher().map((item, idx) => (
                             <tr key={idx}><td className="px-10 py-6 font-mono text-xs text-indigo-600 font-bold">{item.accountCode}</td><td className="px-10 py-6 text-xs font-black uppercase tracking-tight">{item.accountName}</td><td className="px-10 py-6 text-right font-black text-slate-900">{item.debit > 0 ? `$${item.debit.toLocaleString()}` : '-'}</td><td className="px-10 py-6 text-right font-black text-slate-900">{item.credit > 0 ? `$${item.credit.toLocaleString()}` : '-'}</td></tr>
                           ))}
                         </tbody>
                       </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-6">
                  <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm">
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-10 flex items-center gap-4 italic"><Building2 className="w-8 h-8 text-indigo-600" /> Registro Empresarial</h2>
                    <form onSubmit={(e) => { e.preventDefault(); const c = {...newCompany, id: crypto.randomUUID()} as Company; sqliteStore.saveCompany(c); const updatedComps = sqliteStore.getCompanies(); setCompanies(updatedComps); if(!selectedCompany) setSelectedCompany(updatedComps[0]); alert("Empresa registrada en SQLite."); }} className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RUT Empresa</label>
                        <input required value={newCompany.rut} onChange={e=>setNewCompany({...newCompany, rut: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="76.XXX.XXX-X" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razón Social</label>
                        <input required value={newCompany.name} onChange={e=>setNewCompany({...newCompany, name: e.target.value})} className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="Nombre de la Compañía" />
                      </div>
                      <button type="submit" className="col-span-2 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4 mt-6 transform hover:-translate-y-1">
                        <Save className="w-6 h-6 text-indigo-400" /> Guardar en Motor SQLite
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal Nuevo Colaborador (Paso 4.4.1) */}
      {showEmpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <button onClick={() => setShowEmpModal(false)} className="absolute top-10 right-10 p-4 hover:bg-slate-100 rounded-full transition-all"><X className="w-8 h-8" /></button>
            
            <div className="mb-10">
              <h2 className="text-4xl font-black uppercase tracking-tighter italic italic">Ficha RRHH</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Paso 4.4.1: Registro de Personal Nuevo</p>
            </div>
            
            <form onSubmit={handleAddEmployee} className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RUT Trabajador</label>
                <input required value={empForm.rut} onChange={e=>setEmpForm({...empForm, rut: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/10" placeholder="12.345.678-9" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Posición / Cargo</label>
                <input required value={empForm.position} onChange={e=>setEmpForm({...empForm, position: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/10" placeholder="Ej: Analista Contable" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombres</label>
                <input required value={empForm.firstName} onChange={e=>setEmpForm({...empForm, firstName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellidos</label>
                <input required value={empForm.lastName} onChange={e=>setEmpForm({...empForm, lastName: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/10" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Mail className="w-3 h-3" /> Correo Electrónico</label>
                <input type="email" value={empForm.email} onChange={e=>setEmpForm({...empForm, email: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/10" placeholder="usuario@empresa.cl" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sueldo Base Mensual (CLP)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-indigo-300">$</span>
                  <input type="number" required value={empForm.baseSalary} onChange={e=>setEmpForm({...empForm, baseSalary: Number(e.target.value)})} className="w-full px-12 py-6 bg-indigo-50 border-none rounded-[2rem] font-black text-3xl text-indigo-700 focus:ring-4 focus:ring-indigo-500/20" />
                </div>
              </div>
              <button type="submit" className="col-span-2 py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 mt-4 hover:scale-105 active:scale-95">
                <UserPlus className="w-6 h-6" /> Guardar Ficha Permanente
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
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${active ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
    <Icon className="w-5 h-5" /> {label}
  </button>
);

const StatCard = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-110 transition-transform flex items-center justify-center`}>
      <Icon className={`w-10 h-10 ${color} opacity-20`} />
    </div>
    <div className={`w-14 h-14 rounded-2xl bg-slate-50 ${color} flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform shadow-sm`}>
      <Icon className="w-7 h-7" />
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
    <div className="flex items-baseline gap-2 mt-2">
      <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
      <span className="text-[9px] font-black text-slate-400 uppercase">{sub}</span>
    </div>
  </div>
);

const LoadingScreen = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
    <div className="w-24 h-24 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin mb-10 shadow-2xl shadow-indigo-500/20"></div>
    <h2 className="text-xs font-black uppercase tracking-[0.5em] text-indigo-400 animate-pulse italic">Payroll Engine v4.4.1</h2>
  </div>
);

export default App;
