import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Filter, Download } from 'lucide-react';
import { useTrades } from '../hooks/useTrades';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export const Trades = () => {
  const [timeframe, setTimeframe] = useState('24h');
  const { trades, stats, isLoading } = useTrades(undefined, undefined, timeframe);

  // Calculate trade distribution by bot
  const botTradeDistribution = trades.reduce((acc, trade) => {
    const botId = trade.bot_id;
    if (!acc[botId]) {
      acc[botId] = {
        name: trade.strategy, // Using strategy as bot name for display
        value: 0,
      };
    }
    acc[botId].value++;
    return acc;
  }, {} as Record<string, { name: string; value: number }>);

  const pieChartData = Object.values(botTradeDistribution);

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("Trading History Report", 105, 15, { align: "center" });
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 22, { align: "center" });
    
    // Stats
    doc.setFontSize(14);
    doc.text("Trading Statistics", 14, 35);
    
    const statsData = [
      ["Total Trades", stats?.totalTrades.toString() || "0"],
      ["Win Rate", `${(stats?.winRate || 0).toFixed(2)}%`],
      ["Total P&L", `$${(stats?.totalPnl || 0).toLocaleString()}`],
      ["Avg. P&L per Trade", `$${(stats?.avgPnlPerTrade || 0).toFixed(2)}`],
      ["Avg. Slippage", `${(stats?.avgSlippage || 0).toFixed(4)}%`],
      ["Avg. Execution Time", `${(stats?.avgExecutionTime || 0).toFixed(2)}ms`]
    ];
    
    (doc as any).autoTable({
      startY: 40,
      head: [["Metric", "Value"]],
      body: statsData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    // Trades Table
    doc.setFontSize(14);
    doc.text("Recent Trades", 14, (doc as any).lastAutoTable.finalY + 15);
    
    const tradesData = trades.map(trade => [
      format(new Date(trade.entry_timestamp), 'yyyy-MM-dd HH:mm'),
      trade.pair,
      trade.exchange,
      trade.trade_type,
      `$${trade.entry_price.toFixed(2)}`,
      trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-',
      trade.quantity.toString(),
      trade.pnl ? `$${trade.pnl.toFixed(2)}` : '-',
      trade.status.toUpperCase()
    ]);
    
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Date", "Pair", "Exchange", "Type", "Entry Price", "Exit Price", "Quantity", "P&L", "Status"]],
      body: tradesData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save("trading-history.pdf");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trading History</h1>
        <div className="flex space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bot Trade Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Bot Trade Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trading Statistics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Trading Statistics</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">Total Trades</p>
              <p className="text-2xl font-bold">{stats?.totalTrades || 0}</p>
            </div>
            <div>
              <p className="text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-500">{stats ? `${stats.winRate.toFixed(1)}%` : '0%'}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold">${trades.reduce((sum, trade) => sum + (trade.quantity * trade.entry_price), 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Profit Analysis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Profit Analysis</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">Total Profit</p>
              <p className={`text-2xl font-bold ${stats && stats.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats ? `${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Average Profit per Trade</p>
              <p className={`text-2xl font-bold ${stats && stats.avgPnlPerTrade >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats ? `${stats.avgPnlPerTrade >= 0 ? '+' : ''}$${stats.avgPnlPerTrade.toFixed(2)}` : '$0.00'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Best Performing Pair</p>
              <p className="text-2xl font-bold">
                {(() => {
                  const pairPerformance = trades.reduce((acc, trade) => {
                    if (!trade.pnl) return acc;
                    acc[trade.pair] = (acc[trade.pair] || 0) + trade.pnl;
                    return acc;
                  }, {} as Record<string, number>);
                  
                  const entries = Object.entries(pairPerformance);
                  if (entries.length === 0) return 'N/A';
                  
                  const [bestPair] = entries.sort((a, b) => b[1] - a[1])[0];
                  return bestPair;
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Recent Trades</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Date</th>
                <th className="text-left py-3">Trading Pair</th>
                <th className="text-left py-3">Exchange Pair</th>
                <th className="text-left py-3">Type</th>
                <th className="text-left py-3">Amount</th>
                <th className="text-left py-3">Price</th>
                <th className="text-left py-3">Profit/Loss</th>
                <th className="text-left py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-4 text-center">Loading trades...</td>
                </tr>
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4 text-center">No trades found for the selected timeframe.</td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr key={trade.id} className="border-b">
                    <td className="py-3">{format(new Date(trade.entry_timestamp), 'MMM d, yyyy HH:mm')}</td>
                    <td className="py-3 font-medium">{trade.pair}</td>
                    <td className="py-3">{trade.exchange}</td>
                    <td className="py-3 capitalize">{trade.trade_type}</td>
                    <td className="py-3">{trade.quantity} {trade.pair.split('/')[0]}</td>
                    <td className="py-3">${trade.entry_price.toFixed(2)}</td>
                    <td className="py-3 flex items-center">
                      {trade.pnl !== null ? (
                        trade.pnl > 0 ? (
                          <span className="flex items-center text-green-500">
                            <ArrowUpRight className="w-4 h-4 mr-1" />
                            +${trade.pnl.toFixed(2)}
                          </span>
                        ) : (
                          <span className="flex items-center text-red-500">
                            <ArrowDownRight className="w-4 h-4 mr-1" />
                            ${trade.pnl.toFixed(2)}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-500">Pending</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trade.status === 'closed' 
                          ? 'bg-green-100 text-green-800' 
                          : trade.status === 'open'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.status.toUpperCase()}
                      </span>
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

export default Trades;