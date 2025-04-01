import React from 'react';
import { useSecurityReport } from '../hooks/useSecurityReport';
import { AlertTriangle, AlertOctagon, CheckCircle, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const {
    systemStatus,
    securityMetrics,
    recentIncidents,
    toggleKillSwitch,
    isKillSwitchActive
  } = useSecurityReport();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security Report</h1>
        <button
          onClick={toggleKillSwitch}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isKillSwitchActive 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
        >
          {isKillSwitchActive ? (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              System Halted - Click to Resume
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              System Active - Click to Halt
            </>
          )}
        </button>
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
            <LineChart data={securityMetrics.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="failedValidations" 
                stroke="#EAB308" 
                name="Failed Validations" 
              />
              <Line 
                type="monotone" 
                dataKey="suspiciousActivities" 
                stroke="#EF4444" 
                name="Suspicious Activities" 
              />
              <Line 
                type="monotone" 
                dataKey="riskScore" 
                stroke="#3B82F6" 
                name="Risk Score" 
              />
            </LineChart>
          </ResponsiveContainer>
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

export default Reports;