import React, { useState } from 'react';
import { Play, Square, Plus, Edit2, Trash2, AlertCircle, Users, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { BotConfig, BotType } from '../types/bots';
import type { Client } from '../types/api';

const SUPPORTED_EXCHANGES = [
  { id: 'binance', name: 'Binance' },
  { id: 'bybit', name: 'Bybit' },
  { id: 'okx', name: 'OKX' },
  { id: 'deribit', name: 'Deribit' },
  { id: 'dex', name: 'DEX' }
] as const;

export const BotManagement = () => {
  const [isAddingBot, setIsAddingBot] = useState(false);
  const [isEditingBot, setIsEditingBot] = useState<string | null>(null);
  const [isAssigningBot, setIsAssigningBot] = useState<string | null>(null);
  const [customPair, setCustomPair] = useState('');
  const queryClient = useQueryClient();

  const { data: botsWithAssignments, isLoading } = useQuery({
    queryKey: ['bots-with-assignments'],
    queryFn: async () => {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('active_bot_assignments')
        .select('*');

      if (assignmentsError) throw assignmentsError;

      const { data: bots, error: botsError } = await supabase
        .from('bot_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (botsError) throw botsError;

      return bots.map(bot => ({
        ...bot,
        assignment: assignments?.find(a => a.bot_id === bot.id)
      }));
    }
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data as Client[];
    }
  });

  const assignBot = useMutation({
    mutationFn: async ({ botId, clientId, notes }: { botId: string; clientId: string; notes?: string }) => {
      const { error: deactivateError } = await supabase
        .from('bot_assignments')
        .update({ status: 'inactive', unassigned_at: new Date().toISOString() })
        .eq('bot_id', botId)
        .eq('status', 'active');

      if (deactivateError) throw deactivateError;

      const { error: assignError } = await supabase
        .from('bot_assignments')
        .insert([{
          bot_id: botId,
          client_id: clientId,
          status: 'active',
          notes
        }]);

      if (assignError) throw assignError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots-with-assignments'] });
      setIsAssigningBot(null);
    }
  });

  const unassignBot = useMutation({
    mutationFn: async (botId: string) => {
      const { error } = await supabase
        .from('bot_assignments')
        .update({ status: 'inactive', unassigned_at: new Date().toISOString() })
        .eq('bot_id', botId)
        .eq('status', 'active');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots-with-assignments'] });
    }
  });

  const updateBotStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'running' | 'stopped' }) => {
      const { error } = await supabase
        .from('bot_configs')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots-with-assignments'] });
    }
  });

  const deleteBot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bot_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots-with-assignments'] });
    }
  });

  const handleStartStop = async (bot: BotConfig) => {
    const newStatus = bot.status === 'running' ? 'stopped' : 'running';
    await updateBotStatus.mutateAsync({ id: bot.id, status: newStatus });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this bot?')) {
      await deleteBot.mutateAsync(id);
    }
  };

  const handleAssign = async (botId: string, clientId: string, notes?: string) => {
    await assignBot.mutateAsync({ botId, clientId, notes });
  };

  const handleUnassign = async (botId: string) => {
    if (window.confirm('Are you sure you want to unassign this bot?')) {
      await unassignBot.mutateAsync(botId);
    }
  };

  const getBotTypeColor = (type: BotType) => {
    switch (type) {
      case 'basis':
        return 'text-blue-600';
      case 'perpetual':
        return 'text-purple-600';
      case 'dex':
        return 'text-green-600';
      case 'statistical':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bot Management</h1>
        <button
          onClick={() => setIsAddingBot(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Bot
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Active Bots</h3>
          <p className="text-3xl font-bold text-green-600">
            {botsWithAssignments?.filter(bot => bot.status === 'running').length || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Bots</h3>
          <p className="text-3xl font-bold text-blue-600">
            {botsWithAssignments?.length || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Bots with Errors</h3>
          <p className="text-3xl font-bold text-red-600">
            {botsWithAssignments?.filter(bot => bot.status === 'error').length || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Assigned Bots</h3>
          <p className="text-3xl font-bold text-purple-600">
            {botsWithAssignments?.filter(bot => bot.assignment).length || 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-xl font-semibold">Configured Bots</h2>
        </div>
        <div className="border-t border-gray-200">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit Threshold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position Limit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {botsWithAssignments?.map((bot) => (
                <tr key={bot.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {bot.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getBotTypeColor(bot.type)}`}>
                      {bot.type.toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bot.assignment ? (
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">{bot.assignment.client_name}</div>
                        <button
                          onClick={() => handleUnassign(bot.id)}
                          className="ml-2 text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsAssigningBot(bot.id)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Assign
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bot.status)}`}>
                      {bot.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bot.min_profit_threshold}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${bot.max_position_size.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleStartStop(bot)}
                        className={`p-1 rounded-full ${
                          bot.status === 'running'
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {bot.status === 'running' ? (
                          <Square className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setIsEditingBot(bot.id)}
                        className="p-1 rounded-full text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(bot.id)}
                        className="p-1 rounded-full text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(isAddingBot || isEditingBot) && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium mb-4">
              {isEditingBot ? 'Edit Bot' : 'Add New Bot'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              // Form submission logic here
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    name="type"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="basis">Basis</option>
                    <option value="perpetual">Perpetual</option>
                    <option value="dex">DEX</option>
                    <option value="statistical">Statistical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Exchanges</label>
                  <div className="mt-2 space-y-2">
                    {SUPPORTED_EXCHANGES.map(exchange => (
                      <label key={exchange.id} className="inline-flex items-center mr-4">
                        <input
                          type="checkbox"
                          name="exchanges"
                          value={exchange.id}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{exchange.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Custom Trading Pair</label>
                  <input
                    type="text"
                    name="custom_pair"
                    value={customPair}
                    onChange={(e) => setCustomPair(e.target.value.toUpperCase())}
                    placeholder="e.g., BTC/USD"
                    pattern="[A-Z0-9]+/[A-Z0-9]+"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Format: COIN/CURRENCY (e.g., BTC/USD, ETH/USD)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Profit Threshold (%)
                  </label>
                  <input
                    type="number"
                    name="minProfitThreshold"
                    step="0.1"
                    min="0"
                    max="100"
                    defaultValue="0.1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maximum Position Size (USD)
                  </label>
                  <input
                    type="number"
                    name="maxPositionSize"
                    min="100"
                    step="100"
                    defaultValue="10000"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Leverage Limit
                  </label>
                  <input
                    type="number"
                    name="leverageLimit"
                    step="0.1"
                    min="1"
                    max="100"
                    defaultValue="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingBot(false);
                    setIsEditingBot(null);
                  }}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {isEditingBot ? 'Save Changes' : 'Add Bot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAssigningBot && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Assign Bot to Client</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleAssign(
                isAssigningBot,
                formData.get('client_id') as string,
                formData.get('notes') as string
              );
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client</label>
                  <select
                    name="client_id"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select a client</option>
                    {clients?.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Optional notes about this assignment"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAssigningBot(null)}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Assign Bot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotManagement;