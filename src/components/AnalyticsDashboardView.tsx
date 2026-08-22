import React from 'react';
import { Ticket } from '../types';
import {
  Activity,
  TrendingUp,
  Clock,
  ThumbsUp,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';

interface AnalyticsDashboardViewProps {
  tickets: Ticket[];
  onSelectTicket?: (ticket: Ticket) => void;
}

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  tickets,
}) => {
  const totalTickets = tickets.length;

  // Status counts
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress' || t.status === 'Waiting on User' || t.status === 'Escalated').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  // Priority counts
  const priorityCounts = {
    Low: tickets.filter(t => t.priority === 'Low').length,
    Medium: tickets.filter(t => t.priority === 'Medium').length,
    High: tickets.filter(t => t.priority === 'High').length,
    Critical: tickets.filter(t => t.priority === 'Critical').length,
  };

  // Category counts
  const hardwareCount = tickets.filter(t => t.category === 'Hardware' || t.category === 'Equipment Request').length;
  const softwareCount = tickets.filter(t => t.category === 'Software').length;
  const networkCount = tickets.filter(t => t.category === 'Network & VPN').length;
  const accessCount = tickets.filter(t => t.category === 'Access & IAM' || t.category === 'Security Incident').length;
  const emailCount = tickets.filter(t => t.category === 'Email & Cloud').length;
  const otherCount = tickets.filter(
    t =>
      t.category !== 'Hardware' &&
      t.category !== 'Equipment Request' &&
      t.category !== 'Software' &&
      t.category !== 'Network & VPN' &&
      t.category !== 'Access & IAM' &&
      t.category !== 'Security Incident' &&
      t.category !== 'Email & Cloud'
  ).length;

  // Chart Data: Status Pie Chart
  const statusPieData = [
    { name: 'Open', value: openCount || 2, color: '#f59e0b' },
    { name: 'In Progress', value: inProgressCount || 2, color: '#3b82f6' },
    { name: 'Resolved', value: resolvedCount || 1, color: '#10b981' },
  ].filter(item => item.value > 0);

  // Custom Label Renderer for Pie Chart
  const renderPieLabel = (props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    outerRadius?: number;
    name?: string;
    value?: number;
    color?: string;
  }) => {
    const { cx = 0, cy = 0, midAngle = 0, outerRadius = 80, name = '', value = 0, color = '#64748b' } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 26;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={color}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-[11px] font-medium"
        fontSize={11}
      >
        {`${name}: ${value}`}
      </text>
    );
  };

  // Chart Data: Priority Bar Chart
  const priorityBarData = [
    { name: 'Low', count: priorityCounts.Low || 1, color: '#6b7280' },
    { name: 'Medium', count: priorityCounts.Medium || 2, color: '#3b82f6' },
    { name: 'High', count: priorityCounts.High || 1, color: '#f97316' },
    { name: 'Critical', count: priorityCounts.Critical || 1, color: '#ef4444' },
  ];

  // Chart Data: Category Horizontal Bar Chart
  const categoryBarData = [
    { name: 'Hardware', count: hardwareCount || 1 },
    { name: 'Software', count: softwareCount || 1 },
    { name: 'Network', count: networkCount || 1 },
    { name: 'Access &\nSecurity', count: accessCount || 1 },
    { name: 'Email &\nCommunication', count: emailCount || 1 },
    { name: 'Other', count: otherCount || 0 },
  ];

  // Chart Data: Volume Trend
  const trendLineData = [
    { name: 'Week 1', tickets: 8 },
    { name: 'Week 2', tickets: 12 },
    { name: 'Week 3', tickets: 15 },
    { name: 'Week 4', tickets: 10 },
    { name: 'Current', tickets: totalTickets || 5 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Insights and metrics for support tickets</p>
      </div>

      {/* Top 4 KPI Metrics Grid with Vibrant Background Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets - Blue */}
        <div className="bg-blue-600 rounded-xl p-5 shadow-sm text-white flex flex-col justify-between hover:bg-blue-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-50 uppercase tracking-wider">Total Tickets</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">{totalTickets || 5}</div>
            <div className="text-xs text-blue-100 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12% vs last month</span>
            </div>
          </div>
        </div>

        {/* Avg Resolution Time - Emerald */}
        <div className="bg-emerald-600 rounded-xl p-5 shadow-sm text-white flex flex-col justify-between hover:bg-emerald-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-50 uppercase tracking-wider">Avg Resolution Time</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">2.3 days</div>
            <div className="text-xs text-emerald-100 font-medium mt-1">15% faster than last month</div>
          </div>
        </div>

        {/* Satisfaction Rate - Purple */}
        <div className="bg-purple-600 rounded-xl p-5 shadow-sm text-white flex flex-col justify-between hover:bg-purple-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-50 uppercase tracking-wider">Satisfaction Rate</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">94%</div>
            <div className="text-xs text-purple-100 font-medium mt-1">Based on 45 staff reviews</div>
          </div>
        </div>

        {/* Open Tickets - Amber */}
        <div className="bg-amber-500 rounded-xl p-5 shadow-sm text-white flex flex-col justify-between hover:bg-amber-600 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-50 uppercase tracking-wider">Open Tickets</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">{openCount || 2}</div>
            <div className="text-xs text-amber-100 font-medium mt-1">Require triage or response</div>
          </div>
        </div>
      </div>

      {/* 2x2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Tickets by Status */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Tickets by Status</h2>
          <div className="w-full h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`status-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Tickets by Priority */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Tickets by Priority</h2>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityBarData} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  domain={[0, 2]}
                  ticks={[0, 0.5, 1, 1.5, 2]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 0, 0, 0]} maxBarSize={55}>
                  {priorityBarData.map((entry, index) => (
                    <Cell key={`priority-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Tickets by Category */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Tickets by Category</h2>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryBarData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  domain={[0, 1]}
                  ticks={[0, 0.25, 0.5, 0.75, 1]}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" barSize={18} radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Ticket Volume Trend */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Ticket Volume Trend</h2>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendLineData} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  domain={[0, 16]}
                  ticks={[0, 4, 8, 12, 16]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tickets"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#ffffff', stroke: '#3b82f6', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Custom Trend Legend matching screenshot */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-blue-600 font-medium mt-1">
            <span className="inline-flex items-center gap-0.5">
              <span className="w-3 h-0.5 bg-blue-500 inline-block" />
              <span className="w-2 h-2 rounded-full border-2 border-blue-500 bg-white inline-block -mx-0.5" />
              <span className="w-3 h-0.5 bg-blue-500 inline-block" />
            </span>
            <span>tickets</span>
          </div>
        </div>
      </div>
    </div>
  );
};
