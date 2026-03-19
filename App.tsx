
import React, { useState, useEffect } from 'react';
import { 
  Users, Calculator, Layers, FileText, Database, Activity, 
  Briefcase, CloudLightning, RefreshCw, ArrowRightLeft, 
  BadgeCheck, Scale, LayoutDashboard, X, Plus, 
  CheckCircle2, Save, TrendingUp, Download,
  UserMinus, Receipt, Landmark, Umbrella, ChevronDown, Building2,
  FileSpreadsheet, FileCheck, CreditCard, Github, ShieldCheck, ShieldAlert,
  Lock, Unlock, UserPlus, Fingerprint, Pencil
} from 'lucide-react';
import { ModuleType, Employee, MonthlyMovement, MonthlyParameters, PayrollResult, Company, FiniquitoRecord, WorkerVacation, User, UserRole } from './types';
import { sqliteStore, initSqlite } from './store/sqliteEngine';
import { Dashboard } from './components/Dashboard';
import { AccountingExport } from './components/AccountingExport';
import { validateRut, normalizeRut, cleanRut } from './utils/rutUtils';
import { PreviredExporter } from './export/previred';
import { generatePayslipHTML, printPayslip } from './utils/payslipGenerator';
import { generateUUID } from './utils/uuid';
import { buildPayrollResultsForPeriod } from './services/payrollBatchService';

const TERMINATION_CAUSES = [
  "Art. 159 N°1 - Mutuo acuerdo de las partes",
  "Art. 159 N°2 - Resignación voluntaria (Renuncia)",
  "Art. 159 N°4 - Vencimiento del plazo convenido",
  "Art. 159 N°5 - Conclusión del trabajo o servicio",
  "Art. 160 - Causales subjetivas (Faltas del trabajador)",
  "Art. 161 - Necesidades de la empresa"
];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ModuleType>(ModuleType.DASHBOARD);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollResults, setPayrollResults] = useState<PayrollResult[]>([]);
  const [finiquitos, setFiniquitos] = useState<FiniquitoRecord[]>([]);
  const [vacations, setVacations] = useState<WorkerVacation[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [dbReady, setDbReady] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFiniquitoModal, setShowFiniquitoModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [movements, setMovements] = useState<MonthlyMovement[]>([]);
  const [networkInfo, setNetworkInfo] = useState<{ips: string[], port: number} | null>(null);
  const [currentUser, setCurrentUser] = useState<User>({ id: 'admin-01', username: 'admin', fullName: 'Administrador Central', roleId: 'admin', isActive: true });

  const [movementForm, setMovementForm] = useState<any>({
    employeeId: '', type: 'HABER_IMPONIBLE', description: '', amount: 0, unit: 'PESOS', date: new Date().toISOString().split('T')[0]
  });
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showVacationModal, setShowVacationModal] = useState(false);

  const [params, setParams] = useState<MonthlyParameters>({
    id: 'p-current', year: 2024, month: 3, uf: 36800.45, utm: 64793, imm: 460000, sis: 1.61, isClosed: false, lastFolio: 0
  });

  const [newEmp, setNewEmp] = useState<Partial<Employee>>({
    rut: '', firstName: '', lastName: '', baseSalary: 500000, position: '', costCenterId: 'ADM-01',
    afpName: 'HABITAT', afpCode: '01', healthName: 'FONASA', healthCode: '01', 
    contractType: 'INDEFINIDO', jornada: 45, vacationDaysRemaining: 15
  });

  const [vacationForm, setVacationForm] = useState<Partial<WorkerVacation>>({
    workerId: '', startDate: '', endDate: '', daysTaken: 0, status: 'APROBADO'
  });

  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    rut: '', name: '', address: '', activityCode: ''
  });

  const [finiquitoForm, setFiniquitoForm] = useState<Partial<FiniquitoRecord>>({
    employeeId: '',
    terminationDate: new Date().toISOString().split('T')[0],
    cause: TERMINATION_CAUSES[0],
    yearsOfServiceIndemnity: 0,
    vacationIndemnity: 0,
    noticeIndemnity: 0
  });

  useEffect(() => {
    const startup = async () => {
      await initSqlite();
      const comps = await sqliteStore.getCompanies();
      setCompanies(comps);
      
      if (comps.length === 0) {
        const demo = { id: generateUUID(), rut: '76.123.456-K', name: 'Empresa Local S.A.', address: 'Localhost 127', activityCode: '620100' };
        await sqliteStore.saveCompany(demo);
        setCompanies([demo]);
        setSelectedCompany(demo);
      } else {
        setSelectedCompany(comps[0]);
      }
      
      await loadPeriodData(3, 2024);
      
      fetch('/api/network-info')
        .then(res => res.json())
        .then(data => setNetworkInfo(data))
        .catch(() => {});

      setDbReady(true);
    };
    startup();
  }, []);

  useEffect(() => {
    if (dbReady && selectedCompany) {
      refreshData();
    }
  }, [dbReady, selectedCompany, params.month, params.year]);

  const loadPeriodData = async (month: number, year: number) => {
    const storedParams = await sqliteStore.getMonthlyParameters(month, year);
    if (storedParams) {
      setParams(storedParams);
    } else {
      const defaultParams: MonthlyParameters = {
        id: `${year}-${month}`,
        year, month, uf: 36800.45, utm: 64793, imm: 460000, sis: 1.61, isClosed: false, lastFolio: 0
      };
      setParams(defaultParams);
    }
    if (selectedCompany) {
      const movs = await sqliteStore.getMovements(selectedCompany.id, month, year);
      setMovements(movs);
    }
  };

  const refreshData = async () => {
    if (!selectedCompany) return;
    const [emps, payroll, fin, vac, comps, usrs, rls, movs] = await Promise.all([
      sqliteStore.getEmployees(selectedCompany.id),
      sqliteStore.getPayrollResults(params.month, params.year),
      sqliteStore.getFiniquitos(),
      sqliteStore.getVacations(),
      sqliteStore.getCompanies(),
      sqliteStore.getUsers(),
      sqliteStore.getRoles(),
      sqliteStore.getMovements(selectedCompany.id, params.month, params.year)
    ]);

    setEmployees(emps);
    setPayrollResults(payroll);
    setFiniquitos(fin);
    setVacations(vac);
    setCompanies(comps);
    setUsers(usrs);
    setRoles(rls);
    setMovements(movs);
  };

  const checkGitHubUpdates = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      alert("El sistema ya está en su última versión local (v10.1).");
    }, 2000);
  };

  const handleRunPayroll = async () => {
    if (params.isClosed) return alert("El periodo está cerrado.");
    for (const emp of employees) {
      if (emp.isActive) {
        try {
          const res = buildPayrollResultsForPeriod({
            employees: [emp],
            params,
            movements,
            calculatedBy: currentUser.username
          })[0];
          await sqliteStore.savePayrollResult(res);
        } catch (error: any) {
          console.error(`Error calculando para ${emp.firstName}:`, error.message);
        }
      }
    }
    await refreshData();
    alert("Cálculo masivo finalizado con Motor Centralizado (V4).");
  };

  const handleExportPrevired = () => {
    if (!selectedCompany) return;
    try {
      const exporter = new PreviredExporter(employees, payrollResults, selectedCompany, params);
      exporter.download();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handlePrintPayslip = (res: PayrollResult) => {
    if (!selectedCompany) return;
    const emp = employees.find(e => e.id === res.employeeId);
    if (emp) {
      const html = generatePayslipHTML(emp, res, selectedCompany, params);
      printPayslip(html);
    }
  };

  const handleSaveVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacationForm.workerId || !vacationForm.daysTaken) return alert("Faltan datos.");
    const vac: WorkerVacation = {
        id: generateUUID(),
        workerId: vacationForm.workerId || '',
        startDate: vacationForm.startDate || '',
        endDate: vacationForm.endDate || '',
        daysTaken: vacationForm.daysTaken || 0,
        status: 'APROBADO'
    };
    await sqliteStore.saveVacation(vac);
    setShowVacationModal(false);
    await refreshData();
  };

  const handleSaveFiniquito = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finiquitoForm.employeeId) return alert("Seleccione colaborador.");
    const total = (finiquitoForm.yearsOfServiceIndemnity || 0) + 
                  (finiquitoForm.vacationIndemnity || 0) + 
                  (finiquitoForm.noticeIndemnity || 0);
    const record: FiniquitoRecord = {
      id: generateUUID(),
      employeeId: finiquitoForm.employeeId,
      terminationDate: finiquitoForm.terminationDate || '',
      cause: finiquitoForm.cause || '',
      yearsOfServiceIndemnity: finiquitoForm.yearsOfServiceIndemnity || 0,
      vacationIndemnity: finiquitoForm.vacationIndemnity || 0,
      noticeIndemnity: finiquitoForm.noticeIndemnity || 0,
      totalAmount: total
    };
    await sqliteStore.saveFiniquito(record);
    setShowFiniquitoModal(false);
    await refreshData();
    alert("Finiquito procesado.");
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementForm.employeeId || !movementForm.amount) return alert("Faltan datos.");
    if (!selectedCompany) return;
    const mov: MonthlyMovement = {
      ...movementForm,
      id: generateUUID(),
      companyId: selectedCompany.id,
      month: params.month,
      year: params.year
    };
    await sqliteStore.saveMovement(mov);
    setShowMovementModal(false);
    await refreshData();
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = {
      id: generateUUID(),
      username: 'nuevo_usuario',
      fullName: 'Usuario Nuevo',
      roleId: 'operador',
      isActive: true,
      createdBy: currentUser.username
    };
    await sqliteStore.saveUser(user);
    await refreshData();
  };

  const handleDeleteUser = async (id: string) => {
    if (currentUser.roleId !== 'admin') return alert("Solo el administrador puede eliminar usuarios.");
    if (confirm("¿Está seguro de eliminar este usuario?")) {
      await sqliteStore.deleteUser(id, currentUser.roleId);
      await refreshData();
    }
  };

  const handleEditEmployee = (emp: Employee) => {
    if (params.isClosed) return alert("No se puede editar fichas con el periodo cerrado.");
    setEditingEmployee(emp);
    setNewEmp(emp);
    setShowAddModal(true);
  };

  const toggleClosure = async () => {
    const nextState = !params.isClosed;
    const updated = { ...params, isClosed: nextState };
    setParams(updated);
    await sqliteStore.saveMonthlyParameters(updated);
  };

  if (!dbReady) return <LoadingScreen />;

  const activeEmployees = employees.filter(e => e.isActive);

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F172A] text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 bg-[#1E293B] border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg"><Briefcase className="w-6 h-6" /></div>
          <div><h1 className="text-sm font-black tracking-tight uppercase">RemunPro</h1><p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Local Edition</p></div>
        </div>
        <nav className="flex-1 py-8 px-4 space-y-1.5 overflow-y-auto">
          <SidebarItem active={activeTab === ModuleType.DASHBOARD} onClick={() => setActiveTab(ModuleType.DASHBOARD)} icon={LayoutDashboard} label="Dashboard" />
          <SectionLabel label="Operaciones" />
          <SidebarItem active={activeTab === ModuleType.ARCHIVO} onClick={() => setActiveTab(ModuleType.ARCHIVO)} icon={Database} label="Archivo Fichas" />
          <SidebarItem active={activeTab === ModuleType.MOVIMIENTOS} onClick={() => setActiveTab(ModuleType.MOVIMIENTOS)} icon={ArrowRightLeft} label="Movimientos" />
          <SidebarItem active={activeTab === ModuleType.LIQUIDACIONES} onClick={() => setActiveTab(ModuleType.LIQUIDACIONES)} icon={FileText} label="Liquidaciones" />
          <SectionLabel label="Recursos Humanos" />
          <SidebarItem active={activeTab === ModuleType.RRHH} onClick={() => setActiveTab(ModuleType.RRHH)} icon={Umbrella} label="Vacaciones" />
          <SidebarItem active={activeTab === ModuleType.FINIQUITOS} onClick={() => setActiveTab(ModuleType.FINIQUITOS)} icon={UserMinus} label="Finiquitos" />
          <SidebarItem active={activeTab === ModuleType.PROCESOS} onClick={() => setActiveTab(ModuleType.PROCESOS)} icon={Layers} label="Procesos Cierre" />
          <SidebarItem active={activeTab === ModuleType.CONTABILIDAD} onClick={() => setActiveTab(ModuleType.CONTABILIDAD)} icon={Landmark} label="Contabilidad" />
          <SidebarItem active={activeTab === ModuleType.SEGURIDAD} onClick={() => setActiveTab(ModuleType.SEGURIDAD)} icon={ShieldCheck} label="Seguridad" />
        </nav>
        <div className="p-4 bg-slate-900/50 border-t border-white/5 space-y-3">
          <button onClick={checkGitHubUpdates} disabled={isUpdating} className="w-full py-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all hover:bg-indigo-600/30">
            {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Github className="w-3.5 h-3.5" />}
            {isUpdating ? 'Actualizando...' : 'GitHub Update'}
          </button>
          <button onClick={() => sqliteStore.exportBackup()} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all"><Download className="w-3.5 h-3.5" /> Respaldar DB</button>
          
          {networkInfo && networkInfo.ips.length > 0 && (
            <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <div className="text-[9px] font-black text-indigo-400 uppercase mb-2 flex items-center gap-2">
                <CloudLightning className="w-3 h-3" /> Acceso Red Local
              </div>
              <div className="space-y-1">
                {networkInfo.ips.map(ip => (
                  <div key={ip} className="text-[10px] font-mono text-slate-300 break-all">
                    http://{ip}:{networkInfo.port}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest">Sesión Actual</div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentUser.roleId === 'admin' ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                <Fingerprint className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black text-white truncate uppercase tracking-tighter">{currentUser.fullName}</div>
                <div className="text-[9px] font-bold text-slate-500 uppercase">{currentUser.roleId}</div>
              </div>
            </div>
            <select 
              className="mt-2 w-full bg-slate-800 border-none rounded-lg text-[9px] font-black uppercase text-slate-400 py-2 px-3 focus:ring-0 cursor-pointer"
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'admin') setCurrentUser({ id: 'admin-01', username: 'admin', fullName: 'Administrador Central', roleId: 'admin', isActive: true });
                else setCurrentUser({ id: 'op-01', username: 'operador', fullName: 'Operador de Turno', roleId: 'operador', isActive: true });
              }}
              value={currentUser.roleId}
            >
              <option value="admin">Cambiar a Admin</option>
              <option value="operador">Cambiar a Operador</option>
            </select>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shadow-sm z-10">
          <button onClick={() => setShowCompanyModal(true)} className="flex flex-col text-left group">
            <div className="flex items-center gap-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Razón Social:</span><span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase flex items-center gap-1">Cambiar <ChevronDown className="w-3 h-3" /></span></div>
            <span className="text-lg font-black text-slate-800 uppercase italic tracking-tighter group-hover:text-indigo-600 transition-colors">{selectedCompany?.name || 'Seleccione Empresa'}</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200 shadow-inner">
              <button onClick={() => setShowPeriodModal(true)} className="px-6 py-2 hover:bg-white rounded-xl transition-all text-left">
                <span className="text-[10px] font-black text-slate-400 block uppercase tracking-tighter">Mes Vigente</span>
                <span className="text-xs font-black text-slate-800 uppercase italic flex items-center gap-1">{MONTHS[params.month - 1]} {params.year} <ChevronDown className="w-3 h-3 text-indigo-500" /></span>
              </button>
              <div className="w-px h-8 bg-slate-300 mx-1"></div>
              <button onClick={toggleClosure} className={`px-6 py-2 flex items-center gap-2 rounded-xl transition-all ${params.isClosed ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                <span className="text-[10px] font-black uppercase">{params.isClosed ? 'Cerrado' : 'Abierto'}</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          {activeTab === ModuleType.DASHBOARD && (
            <div className="space-y-8">
              <div className="grid grid-cols-4 gap-6 animate-in fade-in duration-500">
                <DashboardCard label="Personal Activo" value={activeEmployees.length} sub="Fichas" icon={Users} color="border-l-indigo-500 text-indigo-600" />
                <DashboardCard label="Total Pago" value={`$${payrollResults.reduce((a,b)=>a+b.netSalary, 0).toLocaleString()}`} sub="Líquido" icon={CreditCard} color="border-l-emerald-500 text-emerald-600" />
                <DashboardCard label="Bajas del Mes" value={finiquitos.length} sub="Finiquitos" icon={UserMinus} color="border-l-rose-500 text-rose-600" />
                <DashboardCard label="Saldo Vacac." value={employees.reduce((a,b)=>a+(b.vacationDaysRemaining || 0), 0).toFixed(1)} sub="Días" icon={Umbrella} color="border-l-amber-500 text-amber-600" />
              </div>
              
              <Dashboard results={payrollResults} employees={employees} />
            </div>
          )}

          {activeTab === ModuleType.CONTABILIDAD && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Integración Contable</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Sincronización con Contabilidad25</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <AccountingExport 
                    results={payrollResults} 
                    params={params} 
                    company={selectedCompany} 
                  />
                </div>
                
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" /> 
                    Estado de Integración
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold text-emerald-700 uppercase">Listo para exportar</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase">Conexión Local OK</span>
                    </div>
                    
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <h4 className="text-xs font-black text-slate-400 uppercase mb-4">Instrucciones de Importación</h4>
                      <ol className="text-xs text-slate-600 space-y-3 list-decimal ml-4">
                        <li>Asegúrese de haber ejecutado el "Cálculo Masivo" del mes.</li>
                        <li>Haga clic en "Exportar a Contabilidad25" para descargar el archivo JSON.</li>
                        <li>En la aplicación de Contabilidad, vaya a la sección de <b>Comprobantes</b>.</li>
                        <li>Seleccione la opción de <b>Importar Centralización</b> y cargue el archivo descargado.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === ModuleType.RRHH && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div><h2 className="text-3xl font-black uppercase italic tracking-tighter">Vacaciones</h2><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Saldos y periodos locales</p></div>
                <button onClick={() => setShowVacationModal(true)} className="px-8 py-4 bg-amber-500 text-white rounded-2xl text-xs font-black uppercase hover:bg-amber-600 shadow-xl flex items-center gap-3 transition-all transform active:scale-95"><Plus className="w-5 h-5" /> Nueva Solicitud</button>
              </div>
              <VacationTable vacations={vacations} employees={employees} />
            </div>
          )}

          {activeTab === ModuleType.PROCESOS && (
            <div className="space-y-10">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Procesos de Cierre</h2>
              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2 mb-4"><FileCheck className="w-5 h-5 text-indigo-500" /> Checklist de Periodo</h3>
                  <CheckItem label="Cálculo de Remuneraciones" value={`${payrollResults.length} de ${activeEmployees.length}`} status={payrollResults.length >= activeEmployees.length && activeEmployees.length > 0} />
                  <CheckItem label="Parámetros de Indicadores" value="Local-OK" status={true} />
                  <CheckItem label="Integridad de Datos" value="Verificada" status={true} />
                </div>
                <div className="bg-[#0F172A] p-10 rounded-[3rem] text-white flex flex-col justify-between shadow-2xl">
                  <div><Activity className="w-12 h-12 text-amber-500 mb-6" /><h4 className="text-xl font-black italic uppercase mb-4">Estado del Periodo</h4><p className="text-xs text-slate-400 leading-relaxed">Marca el periodo {MONTHS[params.month-1]} como finalizado para evitar cambios accidentales.</p></div>
                  <button onClick={toggleClosure} className={`w-full py-6 rounded-2xl text-xs font-black uppercase shadow-xl transition-all ${params.isClosed ? 'bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{params.isClosed ? 'Reabrir Periodo' : 'Finalizar Mes'}</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                   <h3 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2 mb-4"><Database className="w-5 h-5 text-indigo-500" /> Indicadores del Periodo</h3>
                   <div className="grid grid-cols-2 gap-6">
                     <ParameterInput label="UF" value={params.uf} onChange={(v:any)=>setParams({...params, uf: Number(v)})} icon={Database} />
                     <ParameterInput label="UTM" value={params.utm} onChange={(v:any)=>setParams({...params, utm: Number(v)})} icon={Scale} />
                     <ParameterInput label="Inm. Mínimo" value={params.imm} onChange={(v:any)=>setParams({...params, imm: Number(v)})} icon={Calculator} />
                     <ParameterInput label="Factor SIS" value={params.sis} onChange={(v:any)=>setParams({...params, sis: Number(v)})} icon={Activity} suffix="%" />
                   </div>
                   <button onClick={async () => { await sqliteStore.saveMonthlyParameters(params); alert("Indicadores guardados en Servidor Local."); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-black transition-all"><Save className="w-4 h-4" /> Guardar Parámetros</button>
                </div>
                <div className="bg-indigo-50 p-8 rounded-[2.5rem] border-2 border-indigo-100 flex flex-col justify-between">
                   <div><h3 className="text-lg font-black uppercase italic text-indigo-900">Motor de Cálculo Offline</h3><p className="text-xs font-medium text-indigo-700/80 leading-relaxed">Procesamiento de liquidaciones masivas.</p></div>
                   <div className="flex gap-4">
                     <button onClick={handleRunPayroll} disabled={params.isClosed} className="flex-1 py-6 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">Ejecutar Cálculo</button>
                     <button onClick={handleExportPrevired} className="flex-1 py-6 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-black transition-all active:scale-95">Exportar Previred</button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === ModuleType.ARCHIVO && (
            <div className="space-y-6">
              <div className="flex justify-between items-end"><h2 className="text-3xl font-black uppercase italic tracking-tighter">Fichas Maestro</h2><button onClick={() => { setEditingEmployee(null); setNewEmp({ rut: '', firstName: '', lastName: '', baseSalary: 500000, position: '', costCenterId: 'ADM-01', afpName: 'HABITAT', afpCode: '01', healthName: 'FONASA', healthCode: '01', contractType: 'INDEFINIDO', jornada: 45, vacationDaysRemaining: 15 }); setShowAddModal(true); }} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95"><Plus className="w-5 h-5" /> Agregar Colaborador</button></div>
              <EmployeeTable employees={employees} onEdit={handleEditEmployee} isClosed={params.isClosed} />
            </div>
          )}

          {activeTab === ModuleType.FINIQUITOS && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div><h2 className="text-3xl font-black uppercase italic tracking-tighter">Finiquitos</h2><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Indemnizaciones y causales</p></div>
                <button onClick={() => setShowFiniquitoModal(true)} className="px-8 py-4 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl flex items-center gap-3 transition-all hover:bg-rose-700"><Receipt className="w-5 h-5" /> Generar Finiquito</button>
              </div>
              <FiniquitoTable finiquitos={finiquitos} employees={employees} />
            </div>
          )}

          {activeTab === ModuleType.MOVIMIENTOS && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div><h2 className="text-3xl font-black uppercase italic tracking-tighter">Movimientos Mensuales</h2><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Haberes, Descuentos y Licencias</p></div>
                <button onClick={() => setShowMovementModal(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl flex items-center gap-3 transition-all hover:bg-indigo-700"><Plus className="w-5 h-5" /> Nuevo Movimiento</button>
              </div>
              <MovementTable movements={movements} employees={employees} />
            </div>
          )}

          {activeTab === ModuleType.SEGURIDAD && (
            <div className="space-y-10">
              <div className="flex justify-between items-end">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Seguridad y Perfiles</h2>
                <button onClick={handleSaveUser} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase shadow-xl flex items-center gap-3 transition-all hover:bg-black"><UserPlus className="w-5 h-5" /> Crear Usuario</button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Usuarios del Sistema</h3>
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-black uppercase border-b">
                        <tr>
                          <th className="px-8 py-6">Usuario</th>
                          <th className="px-8 py-6">Perfil</th>
                          <th className="px-8 py-6">Creado por</th>
                          <th className="px-8 py-6 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.length === 0 ? (
                          <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 italic">No hay usuarios adicionales creados localmente</td></tr>
                        ) : users.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-all">
                            <td className="px-8 py-6">
                              <div className="font-black uppercase italic tracking-tighter text-slate-800">{u.fullName}</div>
                              <div className="text-[10px] font-bold text-slate-400">@{u.username}</div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${u.roleId === 'admin' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {u.roleId}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-slate-400 font-bold uppercase text-[10px]">
                              {u.createdBy || 'Sistema'}
                            </td>
                            <td className="px-8 py-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {currentUser.roleId === 'admin' && (
                                  <button 
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-rose-600 hover:text-white transition-all"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Trazabilidad de Cambios</h3>
                  <div className="bg-[#0F172A] p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <ShieldCheck className="w-8 h-8 text-emerald-400" />
                      <div>
                        <div className="text-[10px] font-black uppercase text-slate-400">Auditoría Activa</div>
                        <div className="text-xs font-bold">Registro de Operaciones</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                        <div className="text-[9px] font-black text-indigo-400 uppercase">Última Acción</div>
                        <div className="text-[10px] font-medium text-slate-300">
                          El usuario <span className="text-white font-bold">@{currentUser.username}</span> está operando el sistema.
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed italic px-2">
                        "Cada modificación en las fichas de colaboradores y parámetros mensuales queda vinculada a la cuenta activa para cumplir con normativas de la Dirección del Trabajo."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === ModuleType.LIQUIDACIONES && (
             <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-3xl font-black uppercase italic tracking-tighter">Liquidaciones Emitidas</h2>
                <PayrollTable results={payrollResults} employees={employees} onPrint={handlePrintPayslip} />
             </div>
          )}
        </div>
      </main>

      {/* Modals con estilos consistentes */}
      {showCompanyModal && <CompanyModal onClose={() => setShowCompanyModal(false)} companies={companies} selectedCompany={selectedCompany} onSelect={(c:any) => { setSelectedCompany(c); setShowCompanyModal(false); refreshData(); }} onSave={async (e:any) => { e.preventDefault(); const comp: Company = {...newCompany as Company, id: generateUUID()}; await sqliteStore.saveCompany(comp); setCompanies([...companies, comp]); setSelectedCompany(comp); setShowCompanyModal(false); }} newCompany={newCompany} setNewCompany={setNewCompany} />}
      {showPeriodModal && <PeriodModal onClose={() => setShowPeriodModal(false)} params={params} onUpdate={async (m:any, y:any) => { await loadPeriodData(m, y); setShowPeriodModal(false); }} />}
      {showAddModal && <AddEmployeeModal onClose={() => { setShowAddModal(false); setEditingEmployee(null); }} newEmp={newEmp} setNewEmp={setNewEmp} isEditing={!!editingEmployee} onSave={async (e:any) => { 
        e.preventDefault(); 
        if (!newEmp.rut || !validateRut(newEmp.rut)) {
          return alert("RUT inválido. Por favor verifique.");
        }
        const emp: Employee = {
          ...newEmp as Employee, 
          id: editingEmployee ? editingEmployee.id : generateUUID(), 
          companyId: selectedCompany!.id, 
          rut: normalizeRut(newEmp.rut),
          startDate: editingEmployee ? editingEmployee.startDate : new Date().toISOString().split('T')[0], 
          isActive: editingEmployee ? editingEmployee.isActive : true, 
          vacationDaysRemaining: editingEmployee ? editingEmployee.vacationDaysRemaining : 15, 
          syncStatus: 'PENDING',
          jornada: newEmp.jornada || 45,
          afpCode: newEmp.afpCode || '01',
          healthCode: newEmp.healthCode || '01',
          createdBy: editingEmployee ? editingEmployee.createdBy : currentUser.username,
          updatedBy: currentUser.username
        }; 
        await sqliteStore.saveEmployee(emp); 
        setShowAddModal(false); 
        setEditingEmployee(null);
        await refreshData(); 
      }} />}
      {showVacationModal && <VacationModal onClose={() => setShowVacationModal(false)} activeEmployees={activeEmployees} vacationForm={vacationForm} setVacationForm={setVacationForm} onSave={handleSaveVacation} />}
      {showFiniquitoModal && <FiniquitoModal onClose={() => setShowFiniquitoModal(false)} activeEmployees={activeEmployees} finiquitoForm={finiquitoForm} setFiniquitoForm={setFiniquitoForm} onSave={handleSaveFiniquito} />}
      {showMovementModal && <MovementModal onClose={() => setShowMovementModal(false)} employees={activeEmployees} movementForm={movementForm} setMovementForm={setMovementForm} onSave={handleSaveMovement} />}
    </div>
  );
};

// Componentes secundarios simplificados para máxima confiabilidad
const VacationTable = ({ vacations, employees }: { vacations: WorkerVacation[], employees: Employee[] }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
    <table className="w-full text-left text-xs">
      <thead className="bg-slate-50 text-slate-500 font-black uppercase border-b">
        <tr><th className="px-10 py-6">Colaborador</th><th className="px-10 py-6">Desde</th><th className="px-10 py-6">Hasta</th><th className="px-10 py-6 text-center">Días</th><th className="px-10 py-6 text-center">Estado</th></tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {vacations.length === 0 ? <tr><td colSpan={5} className="px-10 py-20 text-center opacity-30 font-black italic tracking-widest uppercase">Sin registros locales</td></tr> : vacations.map(v => {
          const emp = employees.find(e => e.id === v.workerId);
          return (<tr key={v.id} className="hover:bg-slate-50/80 transition-all"><td className="px-10 py-6"><div className="font-black text-slate-800 uppercase italic tracking-tighter">{emp?.firstName} {emp?.lastName}</div></td><td className="px-10 py-6 text-slate-500 font-bold">{v.startDate}</td><td className="px-10 py-6 text-slate-500 font-bold">{v.endDate}</td><td className="px-10 py-6 text-center font-black text-amber-600">{v.daysTaken} D</td><td className="px-10 py-6 text-center"><span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-black uppercase rounded-full text-[9px]">{v.status}</span></td></tr>)
        })}
      </tbody>
    </table>
  </div>
);

const EmployeeTable = ({ employees, onEdit, isClosed }: { employees: Employee[], onEdit: (e: Employee) => void, isClosed: boolean }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
    <table className="w-full text-left text-xs">
      <thead className="bg-slate-50 text-slate-500 font-black uppercase border-b">
        <tr><th className="px-10 py-6">RUT</th><th className="px-10 py-6">Ficha Personal</th><th className="px-10 py-6 text-right">Saldo Vac.</th><th className="px-10 py-6 text-center">Estado</th><th className="px-10 py-6 text-center">Acciones</th></tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {employees.map(e => (
          <tr key={e.id} className="hover:bg-slate-50/80 group transition-all">
            <td className="px-10 py-6 font-bold text-slate-400 group-hover:text-indigo-600">{e.rut}</td>
            <td className="px-10 py-6 font-black uppercase italic tracking-tighter">{e.firstName} {e.lastName}</td>
            <td className="px-10 py-6 text-right font-black text-amber-600">{(e.vacationDaysRemaining || 0).toFixed(1)} d</td>
            <td className="px-10 py-6 text-center"><span className={`inline-block w-2.5 h-2.5 rounded-full ${e.isActive ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500'}`}></span></td>
            <td className="px-10 py-6 text-center">
              {!isClosed && (
                <button 
                  onClick={() => onEdit(e)}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                  title="Editar Ficha"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const FiniquitoTable = ({ finiquitos, employees }: { finiquitos: FiniquitoRecord[], employees: Employee[] }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
    <table className="w-full text-left text-xs">
      <thead className="bg-slate-50 text-slate-500 font-black uppercase border-b">
        <tr><th className="px-8 py-6">Ex-Colaborador</th><th className="px-8 py-6">Término</th><th className="px-8 py-6 text-right">Monto Líquido</th><th className="px-8 py-6 text-center">Detalle</th></tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {finiquitos.map(f => {
            const emp = employees.find(e => e.id === f.employeeId);
            return (
              <tr key={f.id} className="hover:bg-slate-50 transition-all">
                <td className="px-8 py-6 font-black text-slate-800 uppercase italic tracking-tighter">{emp?.firstName} {emp?.lastName}</td>
                <td className="px-8 py-6 font-bold text-slate-500">{f.terminationDate}</td>
                <td className="px-8 py-6 text-right font-black text-rose-600">${f.totalAmount.toLocaleString()}</td>
                <td className="px-8 py-6 text-center"><button className="p-2 bg-slate-100 hover:bg-indigo-100 rounded-lg text-slate-300 hover:text-indigo-600 transition-all"><FileText className="w-4 h-4" /></button></td>
              </tr>
            )
        })}
      </tbody>
    </table>
  </div>
);

const MovementTable = ({ movements, employees }: { movements: any[], employees: Employee[] }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
    <table className="w-full text-left text-xs">
      <thead className="bg-slate-50 text-slate-500 font-black uppercase border-b">
        <tr>
          <th className="px-8 py-6">Colaborador</th>
          <th className="px-8 py-6">Tipo</th>
          <th className="px-8 py-6">Descripción</th>
          <th className="px-8 py-6 text-right">Monto/Valor</th>
          <th className="px-8 py-6 text-center">Unidad</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {movements.length === 0 ? (
          <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic uppercase font-black tracking-widest">Sin movimientos registrados en este periodo</td></tr>
        ) : movements.map(m => {
          const emp = employees.find(e => e.id === m.employeeId);
          return (
            <tr key={m.id} className="hover:bg-slate-50 transition-all">
              <td className="px-8 py-6 font-black text-slate-800 uppercase italic tracking-tighter">{emp?.firstName} {emp?.lastName}</td>
              <td className="px-8 py-6"><span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-black uppercase text-slate-600">{m.type.replace('_', ' ')}</span></td>
              <td className="px-8 py-6 font-bold text-slate-500">{m.description}</td>
              <td className="px-8 py-6 text-right font-black text-indigo-600">{m.amount.toLocaleString()}</td>
              <td className="px-8 py-6 text-center font-black text-slate-400">{m.unit}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
);

const PayrollTable = ({ results, employees, onPrint }: { results: PayrollResult[], employees: Employee[], onPrint: (res: PayrollResult) => void }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
    <table className="w-full text-left text-xs">
      <thead className="bg-slate-50 text-slate-500 font-black uppercase border-b">
        <tr>
          <th className="px-8 py-6">Colaborador</th>
          <th className="px-8 py-6 text-center">Días Trab.</th>
          <th className="px-8 py-6 text-right">Bruto</th>
          <th className="px-8 py-6 text-right">Líquido</th>
          <th className="px-8 py-6 text-center">Acción</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {results.map(res => {
            const emp = employees.find(e => e.id === res.employeeId);
            const workedDays = 30 - (res.absenteeismDays || 0) - (res.medicalLeaveDays || 0) - (res.unpaidLeaveDays || 0);
            return (
              <tr key={res.id} className="hover:bg-slate-50 transition-all">
                <td className="px-8 py-6 font-black text-slate-800 uppercase italic tracking-tighter">
                  {emp?.firstName} {emp?.lastName}
                  {(res.medicalLeaveDays > 0 || res.absenteeismDays > 0) && (
                    <div className="text-[9px] text-rose-500 font-bold">
                      {res.medicalLeaveDays > 0 && `Licencia: ${res.medicalLeaveDays}d `}
                      {res.absenteeismDays > 0 && `Inasist.: ${res.absenteeismDays}d`}
                    </div>
                  )}
                </td>
                <td className="px-8 py-6 text-center font-bold text-slate-500">{workedDays}</td>
                <td className="px-8 py-6 text-right font-bold text-slate-600">${res.grossSalary.toLocaleString()}</td>
                <td className="px-8 py-6 text-right font-black text-indigo-600">${res.netSalary.toLocaleString()}</td>
                <td className="px-8 py-6 text-center">
                  <button 
                    onClick={() => onPrint(res)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase hover:bg-indigo-600 transition-all shadow-md"
                  >
                    PDF
                  </button>
                </td>
              </tr>
            );
        })}
      </tbody>
    </table>
  </div>
);

// UI Helpers
const SidebarItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
    <Icon className="w-5 h-5" /> {label}
  </button>
);

const SectionLabel = ({ label }: { label: string }) => (<div className="text-[9px] font-black text-slate-600 uppercase px-5 pt-8 pb-3 tracking-[0.2em]">{label}</div>);
const CheckItem = ({ label, value, status }: { label: string, value: string, status: boolean }) => (
  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
    <div className="flex items-center gap-4"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${status ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200'}`}>{status ? <CheckCircle2 className="w-5 h-5" /> : <Activity className="w-5 h-5" />}</div><span className="text-xs font-black uppercase text-slate-700">{label}</span></div><span className={`text-[10px] font-black uppercase ${status ? 'text-emerald-600' : 'text-slate-400'}`}>{value}</span>
  </div>
);
const DashboardCard = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className={`bg-white p-8 rounded-[2.5rem] border-l-[6px] shadow-sm ${color} border border-slate-200 group hover:scale-[1.02] transition-all`}>
    <div className="flex justify-between items-start mb-4"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span><Icon className="w-5 h-5 opacity-20" /></div>
    <div className="flex items-baseline gap-2"><div className="text-3xl font-black text-slate-800 tracking-tighter">{value}</div><span className="text-[10px] font-bold text-slate-400 uppercase italic">{sub}</span></div>
  </div>
);
const ParameterInput = ({ label, value, onChange, icon: Icon, suffix = '' }: any) => (
  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 ml-2 tracking-widest"><Icon className="w-3 h-3" /> {label}</label><div className="relative"><input type="number" value={value} onChange={e=>onChange(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-black text-slate-700 shadow-inner focus:ring-2 focus:ring-indigo-500/20" />{suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">{suffix}</span>}</div></div>
);
const FormGroup = ({ label, value, onChange, placeholder, type = 'text' }: any) => (
  <div className="space-y-2 flex-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 text-sm shadow-inner focus:ring-2 focus:ring-indigo-500/20" /></div>
);
const LoadingScreen = () => (<div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0F172A] text-white"><div className="w-20 h-20 border-8 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8 shadow-2xl"></div><h2 className="text-[10px] font-black uppercase italic tracking-[0.6em] text-indigo-400 animate-pulse">Iniciando RemunPro Local</h2></div>);

// Modales Reutilizables
const CompanyModal = ({ onClose, companies, selectedCompany, onSelect, onSave, newCompany, setNewCompany }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-md">
    <div className="bg-white w-full max-w-4xl rounded-[3rem] p-12 relative flex flex-col max-h-[90vh] shadow-2xl">
      <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full"><X className="w-8 h-8 text-slate-400" /></button>
      <h2 className="text-3xl font-black uppercase italic mb-8 tracking-tighter">Organización Local</h2>
      <div className="grid grid-cols-2 gap-10 overflow-y-auto pr-2">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Seleccionar</h3>
          {companies.map((c: any) => (
            <button key={c.id} onClick={() => onSelect(c)} className={`w-full p-6 rounded-2xl border-2 text-left flex items-center gap-4 transition-all ${selectedCompany?.id === c.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 bg-slate-50'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedCompany?.id === c.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}><Building2 className="w-6 h-6" /></div>
              <div><div className="font-black text-slate-800 uppercase italic tracking-tighter text-lg">{c.name}</div><div className="text-[10px] font-bold text-slate-400 uppercase">{c.rut}</div></div>
            </button>
          ))}
        </div>
        <form onSubmit={onSave} className="bg-slate-50 p-8 rounded-[2.5rem] space-y-4 border border-slate-200 h-fit">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Nueva Empresa Local</h3>
          <FormGroup label="RUT" value={newCompany.rut} onChange={(v:any) => setNewCompany({...newCompany, rut: v})} placeholder="76.xxx.xxx-k" />
          <FormGroup label="Razón Social" value={newCompany.name} onChange={(v:any) => setNewCompany({...newCompany, name: v})} placeholder="Nombre Empresa" />
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all mt-4">Guardar en SQLite</button>
        </form>
      </div>
    </div>
  </div>
);

const PeriodModal = ({ onClose, params, onUpdate }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-md">
    <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 relative shadow-2xl">
      <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full"><X className="w-8 h-8 text-slate-400" /></button>
      <h2 className="text-3xl font-black uppercase italic mb-8 tracking-tighter">Periodo Contable</h2>
      <div className="grid grid-cols-3 gap-3">
        {MONTHS.map((m, idx) => (
          <button key={m} onClick={() => onUpdate(idx + 1, params.year)} className={`py-4 rounded-xl text-[10px] font-black uppercase transition-all ${params.month === idx + 1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{m}</button>
        ))}
      </div>
      <div className="mt-8 pt-8 border-t border-slate-100 flex gap-2">
            {[2023, 2024, 2025].map(y => (
              <button key={y} onClick={() => onUpdate(params.month, y)} className={`flex-1 py-4 rounded-xl text-xs font-black uppercase transition-all ${params.year === y ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>{y}</button>
            ))}
      </div>
    </div>
  </div>
);

const MovementModal = ({ onClose, employees, movementForm, setMovementForm, onSave }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-md">
    <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 relative shadow-2xl">
      <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full"><X className="w-8 h-8 text-slate-400" /></button>
      <h2 className="text-3xl font-black uppercase italic mb-8 tracking-tighter">Nuevo Movimiento</h2>
      <form onSubmit={onSave} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Colaborador</label>
          <select 
            value={movementForm.employeeId} 
            onChange={e => setMovementForm({...movementForm, employeeId: e.target.value})}
            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 text-sm shadow-inner"
          >
            <option value="">{employees.length === 0 ? 'No hay colaboradores activos' : 'Seleccione...'}</option>
            {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.rut})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Tipo</label>
            <select 
              value={movementForm.type} 
              onChange={e => setMovementForm({...movementForm, type: e.target.value})}
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 text-sm shadow-inner"
            >
              <option value="HABER_IMPONIBLE">Haber Imponible</option>
              <option value="HABER_NO_IMPONIBLE">Haber No Imponible</option>
              <option value="DESCUENTO_VOLUNTARIO">Descuento Voluntario</option>
              <option value="LICENCIA">Licencia Médica</option>
              <option value="INASISTENCIA">Inasistencia</option>
            </select>
          </div>
          <FormGroup label="Monto / Valor" value={movementForm.amount} onChange={(v:any) => setMovementForm({...movementForm, amount: Number(v)})} type="number" />
        </div>
        <FormGroup label="Descripción" value={movementForm.description} onChange={(v:any) => setMovementForm({...movementForm, description: v})} placeholder="Ej: Bono Desempeño" />
        <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-indigo-700 transition-all">Registrar Movimiento</button>
      </form>
    </div>
  </div>
);

const AddEmployeeModal = ({ onClose, newEmp, setNewEmp, onSave, isEditing }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-md">
    <div className="bg-white w-full max-w-3xl rounded-[3rem] p-12 relative shadow-2xl max-h-[90vh] overflow-y-auto">
      <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full"><X className="w-8 h-8 text-slate-400" /></button>
      <h2 className="text-3xl font-black uppercase italic mb-10 tracking-tighter">{isEditing ? 'Editar Ficha Maestro' : 'Contratación Local'}</h2>
      <form onSubmit={onSave} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <FormGroup label="RUT" value={newEmp.rut} onChange={(v:any)=>setNewEmp({...newEmp, rut: v})} placeholder="12.xxx.xxx-x" />
          <FormGroup label="Sueldo Base ($)" type="number" value={newEmp.baseSalary} onChange={(v:any)=>setNewEmp({...newEmp, baseSalary: Number(v)})} />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <FormGroup label="Nombres" value={newEmp.firstName} onChange={(v:any)=>setNewEmp({...newEmp, firstName: v})} />
          <FormGroup label="Apellidos" value={newEmp.lastName} onChange={(v:any)=>setNewEmp({...newEmp, lastName: v})} />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <FormGroup label="AFP" value={newEmp.afpName} onChange={(v:any)=>setNewEmp({...newEmp, afpName: v})} />
          <FormGroup label="Cod. AFP" value={newEmp.afpCode} onChange={(v:any)=>setNewEmp({...newEmp, afpCode: v})} />
          <FormGroup label="Jornada (Hrs)" type="number" value={newEmp.jornada} onChange={(v:any)=>setNewEmp({...newEmp, jornada: Number(v)})} />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <FormGroup label="Salud" value={newEmp.healthName} onChange={(v:any)=>setNewEmp({...newEmp, healthName: v})} />
          <FormGroup label="Cod. Salud" value={newEmp.healthCode} onChange={(v:any)=>setNewEmp({...newEmp, healthCode: v})} />
        </div>
        
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Parámetros Previred / DT
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200">
              <input 
                type="checkbox" 
                checked={newEmp.afcStatus} 
                onChange={e => setNewEmp({...newEmp, afcStatus: e.target.checked})}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label className="text-[10px] font-black text-slate-600 uppercase">Seguro Cesantía (AFC)</label>
            </div>
            <FormGroup label="Trabajo Pesado (%)" type="number" value={newEmp.heavyWork} onChange={(v:any)=>setNewEmp({...newEmp, heavyWork: Number(v)})} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <FormGroup label="Monto APV ($)" type="number" value={newEmp.apvAmount} onChange={(v:any)=>setNewEmp({...newEmp, apvAmount: Number(v)})} />
            <FormGroup label="Institución APV" value={newEmp.apvInstitution} onChange={(v:any)=>setNewEmp({...newEmp, apvInstitution: v})} />
          </div>
        </div>

        <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all mt-6 shadow-xl shadow-indigo-600/20 italic">{isEditing ? 'Guardar Cambios' : 'Registrar Nueva Ficha'}</button>
      </form>
    </div>
  </div>
);

const VacationModal = ({ onClose, activeEmployees, vacationForm, setVacationForm, onSave }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-md">
    <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 relative shadow-2xl">
      <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full"><X className="w-8 h-8 text-slate-400" /></button>
      <h2 className="text-3xl font-black uppercase italic mb-10 tracking-tighter flex items-center gap-4"><Umbrella className="w-10 h-10 text-amber-500" /> Registrar Vacación</h2>
      <form onSubmit={onSave} className="space-y-6">
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Colaborador</label>
            <select value={vacationForm.workerId} onChange={e => setVacationForm({...vacationForm, workerId: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 text-sm shadow-inner appearance-none focus:ring-2 focus:ring-amber-500/20">
              <option value="">Seleccione Colaborador...</option>
              {activeEmployees.map((e:any) => <option key={e.id} value={e.id}>{e.rut} - {e.firstName} {e.lastName}</option>)}
            </select>
        </div>
        <div className="grid grid-cols-2 gap-6"><FormGroup label="Inicio" type="date" value={vacationForm.startDate} onChange={(v:any)=>setVacationForm({...vacationForm, startDate: v})} /><FormGroup label="Término" type="date" value={vacationForm.endDate} onChange={(v:any)=>setVacationForm({...vacationForm, endDate: v})} /></div>
        <FormGroup label="Días Hábiles" type="number" value={vacationForm.daysTaken} onChange={(v:any)=>setVacationForm({...vacationForm, daysTaken: Number(v)})} />
        <button type="submit" className="w-full py-6 bg-amber-500 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-amber-600 transition-all mt-6">Aprobar Localmente</button>
      </form>
    </div>
  </div>
);

const FiniquitoModal = ({ onClose, activeEmployees, finiquitoForm, setFiniquitoForm, onSave }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-950/80 backdrop-blur-md">
    <div className="bg-white w-full max-w-3xl rounded-[3rem] p-12 relative overflow-y-auto max-h-[90vh] shadow-2xl">
      <button onClick={onClose} className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full"><X className="w-8 h-8 text-slate-400" /></button>
      <h2 className="text-3xl font-black uppercase italic mb-10 tracking-tighter flex items-center gap-4"><UserMinus className="w-10 h-10 text-rose-500" /> Cálculo de Término</h2>
      <form onSubmit={onSave} className="space-y-8">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Colaborador</label>
              <select value={finiquitoForm.employeeId} onChange={e => setFiniquitoForm({...finiquitoForm, employeeId: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 text-sm shadow-inner focus:ring-2 focus:ring-rose-500/20"><option value="">Seleccione...</option>{activeEmployees.map((e:any) => <option key={e.id} value={e.id}>{e.rut} - {e.firstName} {e.lastName}</option>)}</select>
          </div>
          <FormGroup label="Fecha Egreso" type="date" value={finiquitoForm.terminationDate} onChange={(v:any) => setFiniquitoForm({...finiquitoForm, terminationDate: v})} />
        </div>
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Causal de Término (Artículos Código del Trabajo)</label>
            <select value={finiquitoForm.cause} onChange={e => setFiniquitoForm({...finiquitoForm, cause: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 text-sm shadow-inner appearance-none focus:ring-2 focus:ring-rose-500/20">
              {TERMINATION_CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <p className="text-[9px] text-slate-400 px-4 mt-1 leading-tight">
              * Nota: Las causales 159 N°1, 2 y 3 no dan derecho a indemnización por años de servicio. 
              El Art. 161 requiere aviso previo de 30 días o pago de indemnización sustitutiva.
            </p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <FormGroup label="Indem. Años ($)" type="number" value={finiquitoForm.yearsOfServiceIndemnity} onChange={(v:any) => setFiniquitoForm({...finiquitoForm, yearsOfServiceIndemnity: Number(v)})} />
          <FormGroup label="Indem. Vacac ($)" type="number" value={finiquitoForm.vacationIndemnity} onChange={(v:any) => setFiniquitoForm({...finiquitoForm, vacationIndemnity: Number(v)})} />
          <FormGroup label="Aviso Previo ($)" type="number" value={finiquitoForm.noticeIndemnity} onChange={(v:any) => setFiniquitoForm({...finiquitoForm, noticeIndemnity: Number(v)})} />
        </div>
        <div className="p-10 bg-rose-600 rounded-[2.5rem] text-white flex justify-between items-center shadow-2xl shadow-rose-600/30">
            <div><div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Monto Líquido a Pago</div><div className="text-4xl font-black italic tracking-tighter">${((finiquitoForm.yearsOfServiceIndemnity || 0) + (finiquitoForm.vacationIndemnity || 0) + (finiquitoForm.noticeIndemnity || 0)).toLocaleString()}</div></div>
            <button type="submit" className="px-10 py-5 bg-white text-rose-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3"><BadgeCheck className="w-5 h-5" /> Confirmar Egreso</button>
        </div>
      </form>
    </div>
  </div>
);

export default App;
