
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { PayrollResult, Employee } from '../types';
import { TrendingUp, Users, DollarSign, Briefcase } from 'lucide-react';

interface DashboardProps {
  results: PayrollResult[];
  employees: Employee[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Dashboard: React.FC<DashboardProps> = ({ results, employees }) => {
  const totalCost = results.reduce((acc, r) => acc + r.grossSalary, 0);
  const activeEmps = employees.filter(e => e.isActive).length;
  const avgSalary = results.length > 0 ? totalCost / results.length : 0;

  const costByCenter = results.reduce((acc: any, r) => {
    acc[r.costCenterId] = (acc[r.costCenterId] || 0) + r.grossSalary;
    return acc;
  }, {});

  const barData = Object.keys(costByCenter).map(key => ({
    name: key,
    value: costByCenter[key]
  }));

  const pieData = results.reduce((acc: any, r) => {
    const emp = employees.find(e => e.id === r.employeeId);
    if (emp) {
      acc[emp.afpName] = (acc[emp.afpName] || 0) + 1;
    }
    return acc;
  }, {});

  const afpData = Object.keys(pieData).map(key => ({
    name: key,
    value: pieData[key]
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Costo Empresa Total" 
          value={`$${totalCost.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-indigo-500"
          trend="+12% vs mes anterior"
        />
        <StatCard 
          title="Colaboradores Activos" 
          value={activeEmps.toString()} 
          icon={Users} 
          color="bg-emerald-500"
        />
        <StatCard 
          title="Sueldo Promedio" 
          value={`$${Math.round(avgSalary).toLocaleString()}`} 
          icon={TrendingUp} 
          color="bg-amber-500"
        />
        <StatCard 
          title="Centros de Costo" 
          value={barData.length.toString()} 
          icon={Briefcase} 
          color="bg-violet-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Center Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Distribución por Centro de Costo</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Costo']}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AFP Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Distribución por AFP</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={afpData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {afpData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 ${color} rounded-xl text-white shadow-lg`}>
        <Icon className="w-6 h-6" />
      </div>
      {trend && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{trend}</span>}
    </div>
    <h4 className="text-sm font-medium text-slate-500">{title}</h4>
    <p className="text-2xl font-black text-slate-800 mt-1">{value}</p>
  </div>
);
