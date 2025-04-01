import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, RefreshCw, Calendar, Download, Filter } from 'lucide-react';
import { useArbitrage } from '../hooks/useArbitrage';
import { useDashboardData } from '../hooks/useDashboardData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const Dashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeframe, setTimeframe] = useState('30d');
  
  const {
    opportunities,
    isLoading: arbLoading,
    executeTrade
  } = useArbitrage(5, 100000, 3);

  const {
    stats,
    botTypePerformance,
    yieldData,
    isLoading: dashboardLoading,
    error: dashboardError
  } = useDashboardData(timeframe);

  const handleRefresh = () => {
    scanForOpportunities();
  };

  const handleExecuteTrade = async (opportunity: any) => {
    const success = await executeTrade(opportunity);
    if (success) {
      console.log('Trade executed successfully');
    }
  };

  const filteredOpportunities = opportunities.filter(opp => {
    if (selectedCategory === 'all') return true;
    return opp.category === selectedCategory;
  });

  const getBotTypeColor = (type: string) => {
    switch (type) {
      case 'basis':
        return 'text-blue-500';
      case 'perpetual':
        return 'text-purple-500';
      case 'dex':
        return 'text-green-500';
      case 'statistical':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  const exportDashboardReport = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("Arbitrage Dashboard Report", 105, 15, { align: "center" });
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()} | Timeframe: ${timeframe}`, 105, 22, { align: "center" });
    
    // Stats
    doc.setFontSize(14);
    doc.text("Performance Overview", 14, 35);
    
    const statsData = [
      ["Total Trades", stats?.totalTrades.toString() || "0"],
      ["Win Rate", `${stats?.winRate.toFixed(2) || 0}%`],
      ["Total P&L", `$${stats?.totalPnl.toLocaleString() || 0}`],
      ["Active Bots", stats?.activeBots.toString() || "0"],
      ["Open Positions", stats?.openPositions.toString() || "0"],
      ["Best Pair", stats?.bestPerformingPair || "N/A"],
      ["Best Bot", stats?.bestPerformingBot || "N/A"]
    ];
    
    (doc as any).autoTable({
      startY: 40,
      head: [["Metric", "Value"]],
      body: statsData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    // Bot Type Performance
    doc.setFontSize(14);
    doc.text("Bot Type Performance", 14, (doc as any).lastAutoTable.finalY + 15);
    
    const botTypeData = botTypePerformance.map(bot => [
      bot.name,
      `${bot.annualYield.toFixed(2)}%`,
      `${bot.monthlyYield.toFixed(2)}%`,
      bot.totalTrades.toString(),
      bot.activeBots.toString()
    ]);
    
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Bot Type", "Annual Yield", "Monthly Yield", "Total Trades", "Active Bots"]],
      body: botTypeData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    // Arbitrage Opportunities
    doc.setFontSize(14);
    doc.text("Current Arbitrage Opportunities", 14, (doc as any).lastAutoTable.finalY + 15);
    
    const opportunitiesData = opportunities.map(opp => [
      opp.token,
      opp.category.toUpperCase(),
      `${opp.source} → ${opp.target}`,
      `${opp.basisSpread.toFixed(2)}%`,
      `${opp.annualizedReturn.toFixed(2)}%`,
      `$${opp.requiredCapital.toLocaleString()}`,
      `$${opp.estimatedProfit.toFixed(2)}`
    ]);
    
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Token", "Type", "Route", "Spread", "Annual Return", "Capital Req.", "Est. Profit"]],
      body: opportunitiesData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save("arbitrage-dashboard-report.pdf");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Arbitrage Dashboard</h1>
        <div className="flex space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={exportDashboardReport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
          <button
            onClick={handleRefresh}
            disabled={arbLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Total P&L</h3>
            <ArrowUpRight className={`${stats?.totalPnl && stats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <p className={`text-3xl font-bold mt-2 ${stats?.totalPnl && stats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats?.totalPnl ? `${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toLocaleString()}` : '$0'}
          </p>
          <p className="text-sm text-gray-500">
            Win Rate: {stats?.winRate ? stats.winRate.toFixed(1) : 0}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Bots</h3>
            <Activity className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{stats?.activeBots || 0}</p>
          <p className="text-sm text-gray-500">
            Open Positions: {stats?.openPositions || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Total Trades</h3>
            <Activity className="text-purple-500" />
          </div>
          <p className="text-3xl font-bold mt-2">
            {stats?.totalTrades || 0}
          </p>
          <p className="text-sm text-gray-500">
            Best Pair: {stats?.bestPerformingPair || 'N/A'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Current Balance</h3>
            <Calendar className="text-green-500" />
          </div>
          <p className="text-3xl font-bold mt-2">
            ${stats?.currentBalance ? stats.currentBalance.toLocaleString() : '0'}
          </p>
          <p className="text-sm text-gray-500">
            Total Invested: ${stats?.totalInvested ? stats.totalInvested.toLocaleString() : '0'}
          </p>
        </div>
      </div>

      {/* Bot Type Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {botTypePerformance.map((bot) => (
          <div key={bot.type} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{bot.name}</h3>
              <Activity className={getBotTypeColor(bot.type)} />
            </div>
            <p className="text-3xl font-bold mt-2">{bot.annualYield.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">Annual Yield</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Monthly</p>
                <p className="font-semibold">{bot.monthlyYield.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-500">Weekly</p>
                <p className="font-semibold">{bot.weeklyYield.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-gray-500">Daily</p>
                <p className="font-semibold">{bot.dailyYield.toFixed(3)}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Yield Performance</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yieldData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="dexYield" 
                stroke="#10B981" 
                name="DEX Yield" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="cexYield" 
                stroke="#3B82F6" 
                name="CEX Yield" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="hybridYield" 
                stroke="#6366F1" 
                name="Hybrid Yield" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="statisticalYield" 
                stroke="#F97316" 
                name="Statistical Yield" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="compound" 
                stroke="#F59E0B" 
                name="Compound Yield" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Arbitrage Opportunities</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-md ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory('dex')}
              className={`px-4 py-2 rounded-md capitalize ${
                selectedCategory === 'dex'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              DEX
            </button>
            <button
              onClick={() => setSelectedCategory('cex')}
              className={`px-4 py-2 rounded-md capitalize ${
                selectedCategory === 'cex'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              CEX
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Type</th>
                <th className="text-left py-3">Token</th>
                <th className="text-left py-3">Source</th>
                <th className="text-left py-3">Target</th>
                <th className="text-left py-3">Spread</th>
                <th className="text-left py-3">Annual Return</th>
                <th className="text-left py-3">Required Capital</th>
                <th className="text-left py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {arbLoading ? (
                <tr>
                  <td colSpan={8} className="py-4 text-center">Loading opportunities...</td>
                </tr>
              ) : filteredOpportunities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4 text-center">No arbitrage opportunities found</td>
                </tr>
              ) : (
                filteredOpportunities.map((opportunity, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 capitalize">{opportunity.category}</td>
                    <td className="py-3">{opportunity.token}</td>
                    <td className="py-3">{opportunity.source}</td>
                    <td className="py-3">{opportunity.target}</td>
                    <td className="py-3 text-green-500">
                      +{opportunity.basisSpread.toFixed(2)}%
                    </td>
                    <td className="py-3 text-green-500">
                      +{opportunity.annualizedReturn.toFixed(2)}%
                    </td>
                    <td className="py-3">
                      ${opportunity.requiredCapital.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleExecuteTrade(opportunity)}
                        disabled={arbLoading}
                        className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        Execute
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;