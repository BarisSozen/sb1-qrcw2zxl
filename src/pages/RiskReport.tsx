import React, { useState } from 'react';
import { useSecurityReport } from '../hooks/useSecurityReport';
import { AlertTriangle, AlertOctagon, CheckCircle, XCircle, Shield, Activity, Zap, Lock, Server, Download, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const MOCK_TREND_DATA = [
  { date: '2025-03-26', failedValidations: 8, suspiciousActivities: 2, riskScore: 0.35 },
  { date: '2025-03-27', failedValidations: 12, suspiciousActivities: 3, riskScore: 0.42 },
  { date: '2025-03-28', failedValidations: 15, suspiciousActivities: 4, riskScore: 0.48 },
  { date: '2025-03-29', failedValidations: 10, suspiciousActivities: 2, riskScore: 0.38 },
  { date: '2025-03-30', failedValidations: 14, suspiciousActivities: 5, riskScore: 0.52 },
  { date: '2025-03-31', failedValidations: 11, suspiciousActivities: 3, riskScore: 0.45 },
  { date: '2025-04-01', failedValidations: 9, suspiciousActivities: 2, riskScore: 0.36 }
];

export const RiskReport = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  const {
    systemStatus,
    securityMetrics,
    recentIncidents,
    isKillSwitchActive,
    toggleKillSwitch
  } = useSecurityReport();

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("Risk Analysis Report", pageWidth / 2, 20, { align: "center" });
    
    // System Status
    doc.setFontSize(16);
    doc.text("System Status", 20, 40);
    doc.setFontSize(12);
    doc.text(`Risk Level: ${systemStatus.riskLevel.toUpperCase()}`, 20, 50);
    doc.text(`Last Updated: ${new Date(systemStatus.lastUpdate).toLocaleString()}`, 20, 60);
    
    // Trading Risk Analysis
    doc.setFontSize(16);
    doc.text("Trading Risk Analysis", 20, 80);
    
    let yPos = 90;
    Object.entries(tradingRiskMetrics).forEach(([key, category]) => {
      doc.setFontSize(14);
      doc.text(category.title, 20, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      category.metrics.forEach(metric => {
        const riskText = `${metric.name}: ${(metric.value * 100).toFixed(1)}% (Threshold: ${(metric.threshold * 100).toFixed(1)}%)`;
        doc.text(riskText, 30, yPos);
        yPos += 7;
      });
      yPos += 10;
    });
    
    // Trading Performance
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Trading Performance", 20, 20);
    
    let perfYPos = 40;
    Object.entries(tradingPerformance).forEach(([period, metrics]) => {
      doc.setFontSize(14);
      doc.text(`${period.charAt(0).toUpperCase() + period.slice(1)} Performance`, 20, perfYPos);
      perfYPos += 10;
      
      doc.setFontSize(12);
      Object.entries(metrics).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 30, perfYPos);
        perfYPos += 7;
      });
      perfYPos += 10;
    });
    
    // Recent Incidents
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Recent Security Incidents", 20, 20);
    
    const incidentData = recentIncidents.map(incident => [
      new Date(incident.timestamp).toLocaleString(),
      incident.type,
      incident.description,
      incident.riskLevel.toUpperCase(),
      incident.status.toUpperCase()
    ]);
    
    (doc as any).autoTable({
      head: [['Time', 'Type', 'Description', 'Risk Level', 'Status']],
      body: incidentData,
      startY: 30,
      margin: { top: 20 }
    });
    
    // Save the PDF
    doc.save('risk-analysis-report.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Risk Report</h1>
        <div className="flex space-x-4">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-4 py-2 border rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={exportToPDF}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
          <button
            onClick={toggleKillSwitch}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Kill Switch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`bg-white p-6 rounded-lg shadow ${
          systemStatus.riskLevel === 'high' ? 'border-2 border-red-500' : ''
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">System Risk Level</h3>
            {systemStatus.riskLevel === 'high' && (
              <AlertOctagon className="text-red-500" />
            )}
          </div>
          <p className={`text-3xl font-bold mt-2 ${
            systemStatus.riskLevel === 'high' 
              ? 'text-red-500' 
              : systemStatus.riskLevel === 'medium'
                ? 'text-yellow-500'
                : 'text-green-500'
          }`}>
            {systemStatus.riskLevel.toUpperCase()}
          </p>
          <p className="text-sm text-gray-500">Last updated: {new Date(systemStatus.lastUpdate).toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Failed Validations (24h)</h3>
            <AlertTriangle className="text-yellow-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{securityMetrics.failedValidations24h}</p>
          <p className="text-sm text-gray-500">
            {securityMetrics.failedValidationsChange}% vs previous 24h
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Suspicious Activities (24h)</h3>
            <AlertOctagon className="text-red-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{securityMetrics.suspiciousActivities24h}</p>
          <p className="text-sm text-gray-500">
            {securityMetrics.suspiciousActivitiesChange}% vs previous 24h
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Security Metrics Trend</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={securityMetrics.trend.length > 0 ? securityMetrics.trend : MOCK_TREND_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Risk Score') {
                    return [`${(value * 100).toFixed(1)}%`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="failedValidations"
                stroke="#EAB308"
                name="Failed Validations"
                strokeWidth={2}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="suspiciousActivities"
                stroke="#EF4444"
                name="Suspicious Activities"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="riskScore"
                stroke="#3B82F6"
                name="Risk Score"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Failed Validations (24h)</p>
            <p className="text-2xl font-bold text-yellow-500">
              {securityMetrics.failedValidations24h}
            </p>
            <p className="text-sm text-gray-500">
              {securityMetrics.failedValidationsChange > 0 ? '+' : ''}
              {securityMetrics.failedValidationsChange}% vs previous
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Suspicious Activities (24h)</p>
            <p className="text-2xl font-bold text-red-500">
              {securityMetrics.suspiciousActivities24h}
            </p>
            <p className="text-sm text-gray-500">
              {securityMetrics.suspiciousActivitiesChange > 0 ? '+' : ''}
              {securityMetrics.suspiciousActivitiesChange}% vs previous
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Current Risk Score</p>
            <p className={`text-2xl font-bold ${
              systemStatus.riskLevel === 'high' 
                ? 'text-red-500' 
                : systemStatus.riskLevel === 'medium'
                  ? 'text-yellow-500'
                  : 'text-green-500'
            }`}>
              {(securityMetrics.trend[securityMetrics.trend.length - 1]?.riskScore * 100 || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500">
              {systemStatus.riskLevel.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Recent Security Incidents</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Time</th>
                <th className="text-left py-3">Type</th>
                <th className="text-left py-3">Description</th>
                <th className="text-left py-3">Risk Level</th>
                <th className="text-left py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentIncidents.map((incident, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3">{new Date(incident.timestamp).toLocaleString()}</td>
                  <td className="py-3">{incident.type}</td>
                  <td className="py-3">{incident.description}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      incident.riskLevel === 'high' 
                        ? 'bg-red-100 text-red-800'
                        : incident.riskLevel === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {incident.riskLevel.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      incident.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {incident.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RiskReport;