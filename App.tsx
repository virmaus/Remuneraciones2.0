
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
  Github
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
  Line,
  Cell
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

  useEffect(() => {
    window.addEventListener('online', () => setIsOffline(false));
    window.addEventListener('offline', () => setIsOffline(true));
    
    // Load initial data
    const companies = db.getCompanies();
    if (companies.length > 0) {
      setSelectedCompany(companies[0]);
    } else {
      // Dummy company for first time load
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
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      const emps = db.getEmployees(selectedCompany.id);
      setEmployees(emps);
      setPayrollResults(db.getPayrollResults(selectedCompany.id, 3, 2024)); // Default to March 2024
    }
  }, [selectedCompany]);

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
    alert('Cálculo de remuneraciones completado para ' + results.length + ' trabajadores.');
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
            <div className="flex items-center gap-2 mt-4 px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-medium">
              <CloudOff className="w-3.5 h-3.5" />
              Modo Offline Activo
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

        <div className="p-4 mt-auto">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors">
            <Github className="w-4 h-4" />
            Actualizar vía GitHub
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <Building2 className="w-6 h-6 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Empresa Activa</p>
              <p className="text-sm font-semibold text-slate-900">{selectedCompany?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-600 tracking-wide uppercase">Periodo: Marzo 2024</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                <img src="https://picsum.photos/40/40" alt="Avatar" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Costo Total Empresa', value: '$12.450.000', icon: Database, color: 'text-indigo-600' },
                  { label: 'Total Trabajadores', value: employees.length, icon: Users, color: 'text-emerald-600' },
                  { label: 'Netos a Pagar', value: '$9.820.500', icon: Calculator, color: 'text-rose-600' },
                  { label: 'Centro de Costos', value: '4 Activos', icon: PieChart, color: 'text-amber-600' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg bg-slate-50 ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    Distribución de Costos por AFP
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={payrollResults.length > 0 ? payrollResults.map(r => ({ name: r.employeeId, value: r.afpAmount })) : [{name: 'Sin datos', value: 0}]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" hide />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-emerald-500" />
                    Proyección de Gasto Mensual
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { name: 'Ene', value: 11000000 },
                        { name: 'Feb', value: 11500000 },
                        { name: 'Mar', value: 12450000 },
                        { name: 'Abr', value: 12200000 },
                        { name: 'May', value: 12800000 },
                        { name: 'Jun', value: 13100000 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Nómina de Trabajadores</h2>
                  <p className="text-slate-500 text-sm mt-1">Administra la base de datos de tu personal siguiendo las guías de creación paso a paso.</p>
                </div>
                <button 
                   onClick={() => {
                     const newEmp: Employee = {
                       id: (employees.length + 1).toString(),
                       companyId: selectedCompany?.id || '1',
                       rut: '20.456.789-0',
                       firstName: 'Nuevo',
                       lastName: 'Trabajador',
                       email: 'nuevo@empresa.com',
                       birthDate: '1990-01-01',
                       contractDate: '2024-01-01',
                       baseSalary: 1200000,
                       afp: 'Habitat',
                       healthSystem: 'Isapre',
                       costCenterId: 'CC01',
                       position: 'Analista'
                     };
                     db.saveEmployee(newEmp);
                     setEmployees([...employees, newEmp]);
                   }}
                   className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all transform active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Crear Trabajador
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">RUT</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Cargo</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Sueldo Base</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-5 text-sm font-semibold text-slate-600">{emp.rut}</td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{emp.firstName} {emp.lastName}</span>
                            <span className="text-xs text-slate-500">{emp.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">{emp.position}</span>
                        </td>
                        <td className="px-6 py-5 text-sm font-bold text-slate-900 text-right">
                          ${emp.baseSalary.toLocaleString('es-CL')}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            <span className="text-xs font-bold text-emerald-600 uppercase">Activo</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {employees.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center opacity-40">
                            <Users className="w-12 h-12 mb-4" />
                            <p className="text-sm font-medium">No hay trabajadores registrados en esta empresa.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payroll' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
              <div className="bg-white p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Calculator className="w-12 h-12 text-indigo-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">Cálculo de Proceso Mensual</h2>
                <p className="text-slate-500 text-lg max-w-lg mx-auto mb-10">
                  Ejecuta el procesamiento masivo de remuneraciones para el periodo de <span className="font-bold text-slate-900">Marzo 2024</span>. 
                  Este proceso aplicará leyes sociales, descuentos y generará los resultados para la centralización contable.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={runCalculation}
                    className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all transform hover:-translate-y-1 active:scale-95"
                  >
                    Iniciar Procesamiento
                  </button>
                  <button 
                    disabled={payrollResults.length === 0}
                    onClick={exportToContabilidad}
                    className={`w-full sm:w-auto px-10 py-5 bg-white text-slate-700 border-2 border-slate-200 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                      payrollResults.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-600 hover:text-indigo-600'
                    }`}
                  >
                    <FileText className="w-6 h-6" />
                    Centralizar a Contabilidad
                  </button>
                </div>

                {payrollResults.length > 0 && (
                   <div className="mt-12 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4 text-left">
                     <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                       <BarChart3 className="w-6 h-6 text-white" />
                     </div>
                     <div>
                       <p className="text-emerald-800 font-bold">Último proceso finalizado</p>
                       <p className="text-emerald-600 text-sm">{payrollResults.length} liquidaciones generadas exitosamente.</p>
                     </div>
                   </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
             <div className="space-y-8 animate-in zoom-in-95 duration-500">
               <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Analítica Avanzada de Costos</h2>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Comparativa Costo Empresa vs Neto</h3>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Jan', costo: 12000, neto: 9500 },
                          { name: 'Feb', costo: 12500, neto: 9800 },
                          { name: 'Mar', costo: 14000, neto: 10500 },
                          { name: 'Apr', costo: 13800, neto: 10200 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="costo" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="neto" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                    <PieChart className="w-16 h-16 text-slate-200 mb-6" />
                    <p className="text-slate-400 text-sm font-medium text-center">Analíticas por Centro de Costos detalladas disponibles tras el cierre de periodo.</p>
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
