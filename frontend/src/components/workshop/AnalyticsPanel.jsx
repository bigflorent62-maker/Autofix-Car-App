import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  CheckCircle,
  Star,
  Euro,
  Brain,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CHART_TYPES = [
  { value: 'bar', label: 'Barre', icon: BarChart3 },
  { value: 'line', label: 'Linea', icon: LineChartIcon },
  { value: 'pie', label: 'Torta', icon: PieChartIcon },
  { value: 'area', label: 'Area', icon: Activity },
];

export default function AnalyticsPanel({ appointments = [], reviews = [] }) {
  const [periodFilter, setPeriodFilter] = useState('month');
  const [leadsChartType, setLeadsChartType] = useState('bar');
  const [conversionChartType, setConversionChartType] = useState('pie');
  const [feedbackChartType, setFeedbackChartType] = useState('bar');
  const [aiAccuracyChartType, setAiAccuracyChartType] = useState('radar');

  // Calculate statistics
  const now = new Date();
  const filterByPeriod = (date) => {
    const itemDate = new Date(date);
    if (periodFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= weekAgo;
    } else if (periodFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return itemDate >= monthAgo;
    } else if (periodFilter === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      return itemDate >= yearAgo;
    }
    return true;
  };

  const filteredAppointments = appointments.filter(a => filterByPeriod(a.created_date));
  const filteredReviews = reviews.filter(r => filterByPeriod(r.created_date));

  // Stats calculations
  const totalLeads = filteredAppointments.length;
  const completedAppointments = filteredAppointments.filter(a => a.status === 'completed').length;
  const confirmedAppointments = filteredAppointments.filter(a => a.status === 'confirmed').length;
  const pendingAppointments = filteredAppointments.filter(a => a.status === 'pending').length;
  const declinedAppointments = filteredAppointments.filter(a => ['declined', 'cancelled'].includes(a.status)).length;
  
  const conversionRate = totalLeads > 0 ? ((completedAppointments / totalLeads) * 100).toFixed(1) : 0;
  const avgRating = filteredReviews.length > 0 
    ? (filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length).toFixed(1) 
    : 0;

  // Calculate actual revenue from completed appointments
  const totalRevenue = filteredAppointments
    .filter(a => a.status === 'completed' && a.amount_spent)
    .reduce((sum, a) => sum + (a.amount_spent || 0), 0);
  
  const avgRevenuePerJob = completedAppointments > 0 
    ? (totalRevenue / completedAppointments).toFixed(0)
    : 0;

  // AI Accuracy calculation
  const appointmentsWithAI = filteredAppointments.filter(a => a.ai_chat_history && a.ai_chat_history.length > 0);
  const completedWithAI = appointmentsWithAI.filter(a => a.status === 'completed');
  const aiAccuracyRate = appointmentsWithAI.length > 0 
    ? ((completedWithAI.length / appointmentsWithAI.length) * 100).toFixed(1)
    : 0;

  // Monthly leads data
  const getMonthlyData = () => {
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const data = months.map((month, index) => {
      const monthAppointments = appointments.filter(a => {
        const date = new Date(a.created_date);
        return date.getMonth() === index && date.getFullYear() === now.getFullYear();
      });
      const completed = monthAppointments.filter(a => a.status === 'completed');
      const monthRevenue = completed.reduce((sum, a) => sum + (a.amount_spent || 0), 0);
      return {
        name: month,
        leads: monthAppointments.length,
        completati: completed.length,
        ricavi: monthRevenue,
        conversione: monthAppointments.length > 0 ? Math.round((completed.length / monthAppointments.length) * 100) : 0
      };
    });
    return data;
  };

  // Conversion funnel data
  const conversionData = [
    { name: 'Lead Ricevuti', value: totalLeads, color: '#3b82f6' },
    { name: 'Confermati', value: confirmedAppointments + completedAppointments, color: '#10b981' },
    { name: 'Completati', value: completedAppointments, color: '#8b5cf6' },
  ];

  // Status distribution
  const statusData = [
    { name: 'Completati', value: completedAppointments, color: '#10b981' },
    { name: 'Confermati', value: confirmedAppointments, color: '#3b82f6' },
    { name: 'In Attesa', value: pendingAppointments, color: '#f59e0b' },
    { name: 'Rifiutati/Annullati', value: declinedAppointments, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Feedback distribution
  const feedbackData = [
    { name: '5 stelle', value: filteredReviews.filter(r => r.rating === 5).length, color: '#10b981' },
    { name: '4 stelle', value: filteredReviews.filter(r => r.rating === 4).length, color: '#22c55e' },
    { name: '3 stelle', value: filteredReviews.filter(r => r.rating === 3).length, color: '#f59e0b' },
    { name: '2 stelle', value: filteredReviews.filter(r => r.rating === 2).length, color: '#f97316' },
    { name: '1 stella', value: filteredReviews.filter(r => r.rating === 1).length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // AI vs Reality data
  const aiVsRealityData = [
    { subject: 'Diagnosi Corrette', ai: aiAccuracyRate, fullMark: 100 },
    { subject: 'Conversione AI', ai: appointmentsWithAI.length > 0 ? (completedWithAI.length / appointmentsWithAI.length * 100).toFixed(0) : 0, fullMark: 100 },
    { subject: 'Conversione Totale', ai: conversionRate, fullMark: 100 },
    { subject: 'Soddisfazione', ai: (avgRating / 5 * 100).toFixed(0), fullMark: 100 },
  ];

  // Service type distribution
  const serviceData = () => {
    const services = {};
    filteredAppointments.forEach(a => {
      const service = a.service_requested || 'Non specificato';
      services[service] = (services[service] || 0) + 1;
    });
    return Object.entries(services).map(([name, value], idx) => ({
      name,
      value,
      color: COLORS[idx % COLORS.length]
    }));
  };

  const renderChart = (type, data, dataKey = 'value', nameKey = 'name') => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey={dataKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey={dataKey}
                nameKey={nameKey}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey={dataKey} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="Performance" dataKey="ai" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  const ChartTypeSelector = ({ value, onChange }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-28 h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CHART_TYPES.map(type => (
          <SelectItem key={type.value} value={type.value}>
            <div className="flex items-center gap-2">
              <type.icon className="h-3 w-3" />
              {type.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Analitiche</h2>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Ultima settimana</SelectItem>
            <SelectItem value="month">Ultimo mese</SelectItem>
            <SelectItem value="year">Ultimo anno</SelectItem>
            <SelectItem value="all">Tutto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Lead</span>
            </div>
            <div className="text-2xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Completati</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{completedAppointments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Conversione</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{conversionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Star className="h-4 w-4" />
              <span className="text-xs">Rating Medio</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{avgRating}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Euro className="h-4 w-4" />
              <span className="text-xs">Ricavi Totali</span>
            </div>
            <div className="text-2xl font-bold text-green-600">€{totalRevenue.toFixed(0)}</div>
            <div className="text-xs text-slate-500 mt-1">Media: €{avgRevenuePerJob}/lavoro</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Brain className="h-4 w-4" />
              <span className="text-xs">Accuratezza AI</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{aiAccuracyRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Leads Over Time */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Lead nel Tempo</CardTitle>
              <ChartTypeSelector value={leadsChartType} onChange={setLeadsChartType} />
            </div>
          </CardHeader>
          <CardContent>
            {renderChart(leadsChartType, getMonthlyData(), 'leads', 'name')}
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Stato Appuntamenti</CardTitle>
              <ChartTypeSelector value={conversionChartType} onChange={setConversionChartType} />
            </div>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              renderChart(conversionChartType, statusData)
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Distribuzione Feedback</CardTitle>
              <ChartTypeSelector value={feedbackChartType} onChange={setFeedbackChartType} />
            </div>
          </CardHeader>
          <CardContent>
            {feedbackData.length > 0 ? (
              renderChart(feedbackChartType, feedbackData)
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                Nessuna recensione disponibile
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI vs Reality */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Performance AI vs Realtà</CardTitle>
              <ChartTypeSelector value={aiAccuracyChartType} onChange={setAiAccuracyChartType} />
            </div>
          </CardHeader>
          <CardContent>
            {aiAccuracyChartType === 'radar' ? (
              renderChart('radar', aiVsRealityData)
            ) : (
              renderChart(aiAccuracyChartType, aiVsRealityData.map(d => ({ name: d.subject, value: parseFloat(d.ai) })))
            )}
          </CardContent>
        </Card>

        {/* Service Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Servizi Richiesti</CardTitle>
          </CardHeader>
          <CardContent>
            {serviceData().length > 0 ? (
              renderChart('pie', serviceData())
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trend Conversione Mensile</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={getMonthlyData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leads" name="Lead" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="completati" name="Completati" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Revenue Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ricavi Mensili</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={getMonthlyData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `€${value}`} />
                <Area type="monotone" dataKey="ricavi" name="Ricavi" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}