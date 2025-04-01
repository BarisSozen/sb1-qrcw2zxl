import React, { useState } from 'react';
import { Plus, Trash2, Edit, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

interface Client {
  id: string;
  name: string;
  email: string;
  wallet_address: string;
  commission_rate: number;
  total_invested: number;
  current_balance: number;
  active: boolean;
  preferred_bot_types: string[];
  sales_rep_id: string | null;
  client_type: 'standard' | 'audit';
}

interface ApiKey {
  id: string;
  client_id: string;
  exchange: string;
  api_key: string;
  active: boolean;
}

interface Wallet {
  id: string;
  client_id: string;
  address: string;
  type: 'dex' | 'cex';
  chain: string;
  label: string;
  active: boolean;
}

interface SalesRep {
  id: string;
  name: string;
  email: string;
  active: boolean;
  default_commission_rate: number;
}

const BOT_TYPES = [
  { id: 'basis', name: 'Basis Arbitrage', description: 'Exploits price differences between spot and futures markets' },
  { id: 'perpetual', name: 'Perpetual Arbitrage', description: 'Capitalizes on funding rate opportunities in perpetual markets' },
  { id: 'dex', name: 'DEX Arbitrage', description: 'Arbitrages between decentralized exchanges' },
  { id: 'statistical', name: 'Statistical Arbitrage', description: 'Uses statistical methods to identify trading opportunities' }
];

const EXCHANGES = [
  { id: 'binance', name: 'Binance', requiresPassphrase: false },
  { id: 'bybit', name: 'Bybit', requiresPassphrase: false },
  { id: 'okx', name: 'OKX', requiresPassphrase: true },
  { id: 'deribit', name: 'Deribit', requiresPassphrase: false }
] as const;

const CHAINS = [
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'binance_smart_chain', name: 'Binance Smart Chain' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'arbitrum', name: 'Arbitrum' },
  { id: 'optimism', name: 'Optimism' }
] as const;

export const Clients = () => {
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isAddingApiKey, setIsAddingApiKey] = useState(false);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [isAuditAccess, setIsAuditAccess] = useState(false);
  const queryClient = useQueryClient();

  // Fetch clients with their sales rep info
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          sales_rep:sales_reps(
            id,
            name,
            email,
            default_commission_rate
          )
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch API keys for selected client
  const { data: apiKeys } = useQuery({
    queryKey: ['apiKeys', selectedClient],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from('exchange_api_keys')
        .select('*')
        .eq('client_id', selectedClient);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient
  });

  // Fetch commission stats
  const { data: commissionStats } = useQuery({
    queryKey: ['commissionStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_stats')
        .select('*')
        .single();
      
      if (error) throw error;
      return data ?? { total_amount: 0, paid_amount: 0, unpaid_amount: 0 };
    }
  });

  // Fetch sales reps
  const { data: salesReps } = useQuery({
    queryKey: ['salesReps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_reps')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as SalesRep[];
    }
  });

  const addClientMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Get selected bot types
      const selectedBotTypes = BOT_TYPES
        .filter(bot => formData.get(`bot_${bot.id}`) === 'on')
        .map(bot => bot.id);

      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      const commissionRate = Number(formData.get('commission_rate'));
      const clientType = isAuditAccess ? 'audit' : 'standard';
      const isSelfRep = formData.get('sales_rep_id') === 'self';

      let salesRepId: string | null = null;

      // If self-rep, create sales rep record first
      if (isSelfRep) {
        const { data: newSalesRep, error: salesRepError } = await supabase
          .from('sales_reps')
          .insert([{
            name,
            email,
            active: true,
            default_commission_rate: commissionRate
          }])
          .select()
          .single();

        if (salesRepError) throw salesRepError;
        salesRepId = newSalesRep.id;
      } else {
        salesRepId = formData.get('sales_rep_id') as string;
      }

      // Create the client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert([{
          name,
          email,
          commission_rate: commissionRate,
          sales_rep_id: salesRepId,
          preferred_bot_types: selectedBotTypes,
          client_type: clientType
        }])
        .select()
        .single();

      if (clientError) throw clientError;

      // Create commission rate record
      const { error: commissionError } = await supabase
        .from('sales_commission_rates')
        .insert([{
          sales_rep_id: salesRepId,
          client_id: clientData.id,
          commission_rate: commissionRate
        }]);

      if (commissionError) throw commissionError;

      // Create bot configs for selected bot types
      for (const botType of selectedBotTypes) {
        const { error: botError } = await supabase
          .from('bot_configs')
          .insert([{
            type: botType,
            name: `${name}'s ${botType} Bot`,
            client_id: clientData.id,
            active: true,
            status: 'stopped',
            min_profit_threshold: 0.1,
            max_position_size: 10000,
            leverage_limit: 3,
            exchanges: ['binance', 'bybit', 'okx'],
            pairs: ['BTC/USD', 'ETH/USD']
          }]);

        if (botError) throw botError;
      }

      return clientData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsAddingClient(false);
      setIsAuditAccess(false);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Clients Management</h1>
        <button
          onClick={() => setIsAddingClient(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </button>
      </div>

      {/* Commission Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Commission</h3>
          <p className="text-3xl font-bold text-green-600">
            ${commissionStats?.total_amount?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Paid Commission</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${commissionStats?.paid_amount?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Pending Commission</h3>
          <p className="text-3xl font-bold text-yellow-600">
            ${commissionStats?.unpaid_amount?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-xl font-semibold">Clients</h2>
        </div>
        <div className="border-t border-gray-200">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Representative
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Invested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {clients?.map((client: any) => (
                <tr key={client.id} onClick={() => setSelectedClient(client.id)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">{client.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.sales_rep ? `${client.sales_rep.name} (${client.sales_rep.email})` : 'Self'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.commission_rate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${client.total_invested?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${client.current_balance?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      client.client_type === 'audit'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {client.client_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      client.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {client.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {isAddingClient && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Add New Client</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              addClientMutation.mutateAsync(formData);
            }}>
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        name="email"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Commission Rate (%)</label>
                      <input
                        type="number"
                        name="commission_rate"
                        min="0"
                        max="100"
                        step="0.1"
                        defaultValue="20"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sales Representative</label>
                      <select
                        name="sales_rep_id"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="self">SELF</option>
                        {salesReps?.map(rep => (
                          <option key={rep.id} value={rep.id}>
                            {rep.name} ({rep.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="audit_access"
                        checked={isAuditAccess}
                        onChange={(e) => setIsAuditAccess(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="audit_access" className="text-sm font-medium text-gray-700">
                        Audit Access
                      </label>
                    </div>
                    {isAuditAccess && (
                      <div className="col-span-2">
                        <p className="text-sm text-yellow-600">
                          ⚠️ Audit access grants this client permission to view all client data, trades, positions, and metrics.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Exchange API Keys */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium mb-4">Exchange API Keys</h4>
                  {EXCHANGES.map(exchange => (
                    <div key={exchange.id} className="mb-6">
                      <h5 className="text-sm font-medium text-gray-700 mb-2 capitalize">{exchange.name}</h5>
                      <div className={`grid grid-cols-1 ${exchange.requiresPassphrase ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">API Key</label>
                          <input
                            type="text"
                            name={`${exchange.id}_api_key`}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">API Secret</label>
                          <input
                            type="password"
                            name={`${exchange.id}_api_secret`}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        {exchange.requiresPassphrase && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Passphrase</label>
                            <input
                              type="password"
                              name={`${exchange.id}_passphrase`}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Wallet Configuration */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium mb-4">Wallet Configuration</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Primary ETH Wallet Address</label>
                      <input
                        type="text"
                        name="eth_address"
                        pattern="^0x[a-fA-F0-9]{40}$"
                        placeholder="0x..."
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        This wallet will be used for DEX transactions and arbitrage operations.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Additional Wallet</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Chain</label>
                          <select
                            name="additional_wallet_chain"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="">Select chain</option>
                            {CHAINS.map(chain => (
                              <option key={chain.id} value={chain.id}>{chain.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Address</label>
                          <input
                            type="text"
                            name="additional_wallet_address"
                            pattern="^0x[a-fA-F0-9]{40}$"
                            placeholder="0x..."
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bot Selection */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium mb-4">Bot Selection</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Select which types of bots this client will use
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {BOT_TYPES.map(bot => (
                      <div key={bot.id} className="flex items-start space-x-3">
                        <div className="flex items-center h-5">
                          <input
                            id={`bot_${bot.id}`}
                            name={`bot_${bot.id}`}
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor={`bot_${bot.id}`} className="font-medium text-gray-700">
                            {bot.name}
                          </label>
                          <p className="text-sm text-gray-500">{bot.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingClient(false);
                    setIsAuditAccess(false);
                  }}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addClientMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {addClientMutation.isPending ? 'Adding...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;