import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Zap, Target, Clock, Activity, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { BotConfig } from '../types/bots';

// Mock data for different bots
const botsData = {
  'basis-arb': {
    name: 'Basis Arbitrage Bot',
    performanceData: [
      { date: '2023-01', pnl: 2500, trades: 150, winRate: 65, drawdown: 8.2 },
      { date: '2023-02', pnl: 3200, trades: 180, winRate: 68, drawdown: 6.5 },
      { date: '2023-03', pnl: 2800, trades: 160, winRate: 62, drawdown: 12.5 },
      { date: '2023-04', pnl: 4100, trades: 200, winRate: 70, drawdown: 5.8 },
      { date: '2023-05', pnl: 3800, trades: 190, winRate: 67, drawdown: 7.2 },
      { date: '2023-06', pnl: 4500, trades: 220, winRate: 71, drawdown: 4.3 }
    ],
    strategyAllocation: [
      { name: 'Basis Trading', value: 40 },
      { name: 'Triangular Arbitrage', value: 30 },
      { name: 'Statistical Arbitrage', value: 20 },
      { name: 'Market Making', value: 10 }
    ],
    riskMetrics: {
      sharpeRatio: 2.8,
      sortinoRatio: 3.2,
      maxDrawdown: 12.5,
      avgDrawdown: 7.4,
      drawdownDuration: 14,
      volatility: 15.8,
      calmarRatio: 1.8,
      avgRecoveryTime: 3.5
    },
    operationalMetrics: {
      successRate: 92,
      uptimePercent: 99.9,
      avgLatency: 45,
      executionSpeed: 0.12,
      orderFillRate: 98.5,
      slippageAvg: 0.05
    },
    efficiencyMetrics: {
      profitFactor: 2.4,
      recoveryFactor: 3.1,
      costEfficiency: 89,
      returnOnCapital: 24.5,
      profitPerTrade: 185,
      winLossRatio: 2.1
    }
  },
  'perp-arb': {
    name: 'Perpetual Arbitrage Bot',
    performanceData: [
      { date: '2023-01', pnl: 3100, trades: 180, winRate: 68, drawdown: 9.1 },
      { date: '2023-02', pnl: 3800, trades: 200, winRate: 70, drawdown: 7.8 },
      { date: '2023-03', pnl: 3400, trades: 175, winRate: 65, drawdown: 14.2 },
      { date: '2023-04', pnl: 4500, trades: 220, winRate: 72, drawdown: 6.4 },
      { date: '2023-05', pnl: 4200, trades: 210, winRate: 69, drawdown: 8.5 },
      { date: '2023-06', pnl: 5000, trades: 240, winRate: 73, drawdown: 5.2 }
    ],
    strategyAllocation: [
      { name: 'Funding Rate Arbitrage', value: 45 },
      { name: 'Index Arbitrage', value: 35 },
      { name: 'Liquidation Hunting', value: 20 }
    ],
    riskMetrics: {
      sharpeRatio: 2.5,
      sortinoRatio: 2.9,
      maxDrawdown: 14.2,
      avgDrawdown: 8.5,
      drawdownDuration: 18,
      volatility: 18.3,
      calmarRatio: 1.6,
      avgRecoveryTime: 4.2
    },
    operationalMetrics: {
      successRate: 88,
      uptimePercent: 99.7,
      avgLatency: 52,
      executionSpeed: 0.15,
      orderFillRate: 97.8,
      slippageAvg: 0.08
    },
    efficiencyMetrics: {
      profitFactor: 2.2,
      recoveryFactor: 2.8,
      costEfficiency: 85,
      returnOnCapital: 22.8,
      profitPerTrade: 165,
      winLossRatio: 1.9
    }
  },
  'dex-arb': {
    name: 'DEX Arbitrage Bot',
    performanceData: [
      { date: '2023-01', pnl: 1800, trades: 120, winRate: 62, drawdown: 11.2 },
      { date: '2023-02', pnl: 2200, trades: 140, winRate: 64, drawdown: 9.5 },
      { date: '2023-03', pnl: 2000, trades: 130, winRate: 61, drawdown: 16.8 },
      { date: '2023-04', pnl: 2800, trades: 160, winRate: 66, drawdown: 8.1 },
      { date: '2023-05', pnl: 2600, trades: 150, winRate: 65, drawdown: 10.4 },
      { date: '2023-06', pnl: 3200, trades: 180, winRate: 68, drawdown: 7.2 }
    ],
    strategyAllocation: [
      { name: 'AMM Arbitrage', value: 50 },
      { name: 'Flash Loans', value: 30 },
      { name: 'MEV', value: 20 }
    ],
    riskMetrics: {
      sharpeRatio: 2.1,
      sortinoRatio: 2.5,
      maxDrawdown: 16.8,
      avgDrawdown: 10.5,
      drawdownDuration: 22,
      volatility: 22.4,
      calmarRatio: 1.4,
      avgRecoveryTime: 5.1
    },
    operationalMetrics: {
      successRate: 85,
      uptimePercent: 99.5,
      avgLatency: 68,
      executionSpeed: 0.18,
      orderFillRate: 96.5,
      slippageAvg: 0.12
    },
    efficiencyMetrics: {
      profitFactor: 1.9,
      recoveryFactor: 2.4,
      costEfficiency: 82,
      returnOnCapital: 19.5,
      profitPerTrade: 145,
      winLossRatio: 1.7
    }
  }
};

export const BotPerformance = () => {
  const [selectedBot, setSelectedBot] = useState('basis-arb');
  const botData = botsData[selectedBot as keyof typeof botsData];

  // Prepare data for radar chart with improved labels
  const radarData = [
    {
      metric: 'Sharpe',
      fullName: 'Sharpe Ratio',
      value: botData.riskMetrics.sharpeRatio / 4,
      fullMark: 1
    },
    {
      metric: 'Win Rate',
      fullName: 'Win Rate',
      value: botData.performanceData[5].winRate / 100,
      fullMark: 1
    },
    {
      metric: 'Success',
      fullName: 'Success Rate',
      value: botData.operationalMetrics.successRate / 100,
      fullMark: 1
    },
    {
      metric: 'Profit',
      fullName: 'Profit Factor',
      value: botData.efficiencyMetrics.profitFactor / 4,
      fullMark: 1
    },
    {
      metric: 'Recovery',
      fullName: 'Recovery Factor',
      value: botData.efficiencyMetrics.recoveryFactor / 4,
      fullMark: 1
    },
    {
      metric: 'Drawdown',
      fullName: 'Max Drawdown',
      value: Math.max(0, 1 - (botData.riskMetrics.maxDrawdown / 100)), // Inverted so lower is worse
      fullMark: 1
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bot Performance</h1>
        <select
          value={selectedBot}
          onChange={(e) => setSelectedBot(e.target.value)}
          className="px-4 py-2 border rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="basis-arb">Basis Arbitrage Bot</option>
          <option value="perp-arb">Perpetual Arbitrage Bot</option>
          <option value="dex-arb">DEX Arbitrage Bot</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Total PnL</h3>
            <ArrowUpRight className="text-green-500" />
          </div>
          <p className="text-3xl font-bold mt-2 text-green-600">
            +${botData.performanceData.reduce((sum, data) => sum + data.pnl, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">
            +{((botData.performanceData[5].pnl - botData.performanceData[4].pnl) / botData.performanceData[4].pnl * 100).toFixed(1)}% vs last month
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Win Rate</h3>
            <TrendingUp className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{botData.performanceData[5].winRate}%</p>
          <p className="text-sm text-gray-500">
            +{(botData.performanceData[5].winRate - botData.performanceData[4].winRate).toFixed(1)}% vs last month
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Total Trades</h3>
            <Activity className="text-purple-500" />
          </div>
          <p className="text-3xl font-bold mt-2">
            {botData.performanceData.reduce((sum, data) => sum + data.trades, 0)}
          </p>
          <p className="text-sm text-gray-500">
            +{((botData.performanceData[5].trades - botData.performanceData[4].trades) / botData.performanceData[4].trades * 100).toFixed(1)}% vs last month
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Avg Profit/Trade</h3>
            <Zap className="text-yellow-500" />
          </div>
          <p className="text-3xl font-bold mt-2">
            ${botData.efficiencyMetrics.profitPerTrade}
          </p>
          <p className="text-sm text-gray-500">
            Win/Loss Ratio: {botData.efficiencyMetrics.winLossRatio.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Drawdown Analysis Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
          Drawdown Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-600">Maximum Drawdown</p>
            <p className="text-2xl font-bold text-red-500">
              {botData.riskMetrics.maxDrawdown}%
            </p>
            <p className="text-sm text-gray-500">Historical worst case</p>
          </div>
          <div>
            <p className="text-gray-600">Average Drawdown</p>
            <p className="text-2xl font-bold text-orange-500">
              {botData.riskMetrics.avgDrawdown}%
            </p>
            <p className="text-sm text-gray-500">Typical scenario</p>
          </div>
          <div>
            <p className="text-gray-600">Recovery Time</p>
            <p className="text-2xl font-bold text-blue-500">
              {botData.riskMetrics.avgRecoveryTime} days
            </p>
            <p className="text-sm text-gray-500">Average time to recover</p>
          </div>
          <div>
            <p className="text-gray-600">Calmar Ratio</p>
            <p className="text-2xl font-bold text-green-500">
              {botData.riskMetrics.calmarRatio}
            </p>
            <p className="text-sm text-gray-500">Return/Max Drawdown</p>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Drawdown History</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={botData.performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="drawdown" 
                  stroke="#EF4444" 
                  name="Drawdown (%)" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-500" />
            Risk Metrics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Sharpe Ratio</p>
              <p className="text-2xl font-bold text-blue-500">
                {botData.riskMetrics.sharpeRatio}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Sortino Ratio</p>
              <p className="text-2xl font-bold text-green-500">
                {botData.riskMetrics.sortinoRatio}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Volatility</p>
              <p className="text-2xl font-bold">
                {botData.riskMetrics.volatility}%
              </p>
            </div>
            <div>
              <p className="text-gray-600">Recovery Factor</p>
              <p className="text-2xl font-bold text-purple-500">
                {botData.efficiencyMetrics.recoveryFactor}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Performance Radar</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid gridType="polygon" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#4B5563', fontSize: 12 }}
                  axisLine={{ strokeWidth: 0.5 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 1]}
                  tick={{ fontSize: 10 }}
                  tickCount={5}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 shadow rounded border">
                          <p className="font-medium">{data.fullName}</p>
                          <p className="text-sm text-gray-600">
                            {(data.value * 100).toFixed(1)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {radarData.map((item) => (
              <div key={item.metric} className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#8884d8]"></span>
                <span>{item.fullName}: {(item.value * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-500" />
            Operational Metrics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Execution Speed</p>
              <p className="text-2xl font-bold text-green-500">
                {botData.operationalMetrics.executionSpeed}s
              </p>
            </div>
            <div>
              <p className="text-gray-600">Order Fill Rate</p>
              <p className="text-2xl font-bold text-blue-500">
                {botData.operationalMetrics.orderFillRate}%
              </p>
            </div>
            <div>
              <p className="text-gray-600">Avg Slippage</p>
              <p className="text-2xl font-bold">
                {botData.operationalMetrics.slippageAvg}%
              </p>
            </div>
            <div>
              <p className="text-gray-600">Uptime</p>
              <p className="text-2xl font-bold text-green-500">
                {botData.operationalMetrics.uptimePercent}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-500" />
            Efficiency Metrics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Return on Capital</p>
              <p className="text-2xl font-bold text-green-500">
                {botData.efficiencyMetrics.returnOnCapital}%
              </p>
            </div>
            <div>
              <p className="text-gray-600">Cost Efficiency</p>
              <p className="text-2xl font-bold text-blue-500">
                {botData.efficiencyMetrics.costEfficiency}%
              </p>
            </div>
            <div>
              <p className="text-gray-600">Profit Factor</p>
              <p className="text-2xl font-bold">
                {botData.efficiencyMetrics.profitFactor}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Win/Loss Ratio</p>
              <p className="text-2xl font-bold text-purple-500">
                {botData.efficiencyMetrics.winLossRatio}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Strategy Allocation</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={botData.strategyAllocation}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {botData.strategyAllocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BotPerformance;