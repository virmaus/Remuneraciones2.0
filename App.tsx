
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Calculator, 
  BarChart3, 
  Settings, 
  Database,
  ChevronRight,
  FileText,
  PieChart,
  Plus,
  CloudOff,
  Github,
  Download,
  RefreshCw,
  X,
  Monitor
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Company, Employee, MonthlyParameters, PayrollResult } from './types';
import { db } from './store/db';
import { calculatePayroll, generateAccountingVoucher } from './services/payrollService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'payroll' | 'analytics' | 'settings'>('dashboard');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollResults, setPayrollResults] = useState<PayrollResult[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada y corriendo como app
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Escuchar eventos de red
    window.addEventListener('online', () => setIsOffline(false));
    window.addEventListener('offline', () => setIsOffline(true));
    
    // Capturar el evento de instalación del navegador
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      console.log('Evento beforeinstallprompt capturado');
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar si hay actualización de Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });
    }

    // Cargar datos iniciales
    const companies = db.getCompanies();
    if (companies.length > 0) {
      setSelectedCompany(companies[0]);
    } else {
      const dummy: Company = {
        id: '1',
        rut: '76.123.456-K',
        name: 'Empresa Demo S.A.',
        address: 'Av. Providencia 1234, Santiago',
        activityCode: '620100'
      };
      db.saveCompany(dummy);
      setSelectedCompany(dummy);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      const emps = db.getEmployees(selectedCompany.id);
      setEmployees(emps);
      setPayrollResults(db.getPayrollResults(selectedCompany.id, 3, 2024));
    }
  }, [selectedCompany]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`Usuario eligió instalación: ${outcome}`);
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleUpdate = () => {
    window.location.reload();
  };

  const runCalculation = () => {
    if (!selectedCompany) return;
    const params: MonthlyParameters = {
      year: 2024,
      month: 3,
      uf: 37000,
      utm: 65000,
      imm: 460000,
      sis: 1.47
    };

    const results = employees.map(emp => calculatePayroll(emp, params));
    db.savePayrollResults(selectedCompany.id, 3, 2024, results);
    setPayrollResults(results);
  };

  const exportToContabilidad = () => {
    const voucher = generateAccountingVoucher(payrollResults);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(voucher));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `centralizacion_remun_${selectedCompany?.rut}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'employees', label: 'Trabajadores', icon: Users },
    { id: 'payroll', label: 'Procesos', icon: Calculator },
    { id: 'analytics', label: 'Analítica', icon: PieChart },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Notificación de Actualización de GitHub */}
      {updateAvailable && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <button 
            onClick={handleUpdate}
            className="flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-full shadow-2xl font-bold border-2 border-white"
          >
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
            Nueva actualización de GitHub lista
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">Remuneraciones<br/><span className="text-indigo-400 font-medium">Pro Analytics</span></h1>
          </div>
          {isOffline && (
            <div className="flex items-center gap-2 mt-4 px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-medium border border-amber-500/30">
              <CloudOff className="w-3.5 h-3.5" />
              Trabajando Offline
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto space-y-2">
          {installPrompt && !isStandalone && (
            <button 
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 rounded-xl text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 animate-pulse"
            >
              <Download className="w-4 h-4" />
              Instalar App
            </button>
          )}
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium bg-slate-800/50 py-2 rounded-lg border border-slate-700">
             <Github className="w-3 h-3" />
             v1.0.3 - Sincronizado
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <Building2 className="w-6 h-6 text-slate-400" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Empresa Activa</p>
              <p className="text-sm font-bold text-slate-900 uppercase">{selectedCompany?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200">
              <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`}></span>
              <span className="text-[10px] font-bold text-slate-600 tracking-wide uppercase">Marzo 2024</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          
          {/* Banner Prominente de Instalación en Dashboard */}
          {activeTab === 'dashboard' && installPrompt && !isStandalone && (
            <div className="mb-8 p-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 rounded-[2rem] shadow-2xl shadow-indigo-200/50 animate-in fade-in zoom-in duration-700">
              <div className="bg-white/95 backdrop-blur-sm p-6 rounded-[1.9rem] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
                    <Monitor className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight">Usa Remuneraciones Pro desde tu Escritorio</h2>
                    <p className="text-slate-500 font-medium">Instala la aplicación para un acceso más rápido y 100% offline.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => setInstallPrompt(null)}
                    className="p-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleInstall}
                    className="flex-1 md:flex-none px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                  >
                    <Download className="w-5 h-5" />
                    Instalar Ahora
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Costo Empresa', value: '$12.450.000', icon: Database, color: 'text-indigo-600' },
                  { label: 'Personal', value: employees.length, icon: Users, color: 'text-emerald-600' },
                  { label: 'Sueldos Líquidos', value: '$9.820.500', icon: Calculator, color: 'text-rose-600' },
                  { label: 'Sucursales', value: '4 Activos', icon: PieChart, color: 'text-amber-600' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-2xl bg-slate-50 ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    Distribución AFP
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={payrollResults.length > 0 ? payrollResults.map(r => ({ name: r.employeeId, value: r.afpAmount })) : [{name: 'Sin datos', value: 0}]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" hide />
                        <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                   <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-emerald-500" />
                    Tendencia de Gastos
                  </h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { name: 'Ene', value: 11000000 },
                        { name: 'Feb', value: 11500000 },
                        { name: 'Mar', value: 12450000 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={4} dot={{ fill: '#10b981', r: 6, strokeWidth: 2, stroke: '#fff' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payroll' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto py-12">
              <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-emerald-500"></div>
                <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3">
                  <Calculator className="w-12 h-12 text-indigo-600" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4 uppercase">Proceso de Marzo 2024</h2>
                <p className="text-slate-500 text-lg max-w-lg mx-auto mb-10 leading-relaxed font-medium">
                  Ejecuta el procesamiento masivo de remuneraciones. Este módulo funciona <span className="text-emerald-600 font-bold">100% offline</span> garantizando la privacidad de tus datos.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={runCalculation}
                    className="group w-full sm:w-auto px-12 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-lg shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                  >
                    Calcular Nómina
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  </button>
                  <button 
                    disabled={payrollResults.length === 0}
                    onClick={exportToContabilidad}
                    className={`w-full sm:w-auto px-12 py-5 bg-white text-slate-700 border-2 border-slate-200 rounded-[1.5rem] font-black text-lg transition-all flex items-center justify-center gap-2 ${
                      payrollResults.length === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:border-indigo-600 hover:text-indigo-600 shadow-xl'
                    }`}
                  >
                    <FileText className="w-6 h-6" />
                    Exportar Centralización
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'employees' && (
            <div className="animate-in zoom-in-95 duration-300">
               <div className="flex items-center justify-between mb-8">
                 <h2 className="text-2xl font-black text-slate-900 uppercase">Personal Activo</h2>
                 <button className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all font-bold text-sm flex items-center gap-2">
                   <Plus className="w-5 h-5" />
                   Ingresar Ficha
                 </button>
               </div>
               <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-20 text-center flex flex-col items-center opacity-30">
                    <Users className="w-20 h-20 mb-4" />
                    <p className="font-black uppercase tracking-widest text-sm">Base de datos local encriptada</p>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
