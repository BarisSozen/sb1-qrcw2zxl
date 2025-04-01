import React, { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { Tab } from '@headlessui/react';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export const Settings = () => {
  const [settings, setSettings] = useState({
    trading: {
      uniswapSlippage: '0.5',
      gasPrice: 'fast',
      minProfitThreshold: '0.1',
      maxTradeAmount: '1000',
      tradingEnabled: true
    },
    notifications: {
      email: true,
      telegram: false,
      discordWebhook: ''
    },
    riskManagement: {
      maxDrawdown: '10',
      stopLossPercentage: '5',
      dailyLossLimit: '1000',
      leverageLimit: '3'
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save settings to backend
    console.log('Saving settings:', settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          <Tab className={({ selected }) =>
            classNames(
              'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
              'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
              selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-600'
            )
          }>
            Trading Parameters
          </Tab>
          <Tab className={({ selected }) =>
            classNames(
              'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
              'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
              selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-600'
            )
          }>
            Risk Management
          </Tab>
          <Tab className={({ selected }) =>
            classNames(
              'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
              'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
              selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-600'
            )
          }>
            Notifications
          </Tab>
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel>
            <div className="bg-white p-6 rounded-lg shadow mt-4">
              <h2 className="text-xl font-bold mb-4">Trading Parameters</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Uniswap Slippage (%)
                  </label>
                  <input
                    type="number"
                    value={settings.trading.uniswapSlippage}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      trading: { ...prev.trading, uniswapSlippage: e.target.value }
                    }))}
                    step="0.1"
                    min="0.1"
                    max="5"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Gas Price Strategy
                  </label>
                  <select
                    value={settings.trading.gasPrice}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      trading: { ...prev.trading, gasPrice: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="slow">Slow (Cheaper)</option>
                    <option value="standard">Standard</option>
                    <option value="fast">Fast (Recommended)</option>
                    <option value="instant">Instant (Expensive)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Profit Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={settings.trading.minProfitThreshold}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      trading: { ...prev.trading, minProfitThreshold: e.target.value }
                    }))}
                    step="0.1"
                    min="0.1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maximum Trade Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={settings.trading.maxTradeAmount}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      trading: { ...prev.trading, maxTradeAmount: e.target.value }
                    }))}
                    min="100"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.trading.tradingEnabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      trading: { ...prev.trading, tradingEnabled: e.target.checked }
                    }))}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Enable Trading
                  </label>
                </div>
              </div>
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="bg-white p-6 rounded-lg shadow mt-4">
              <h2 className="text-xl font-bold mb-4">Risk Management</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maximum Drawdown (%)
                  </label>
                  <input
                    type="number"
                    value={settings.riskManagement.maxDrawdown}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      riskManagement: { ...prev.riskManagement, maxDrawdown: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Stop Loss (%)
                  </label>
                  <input
                    type="number"
                    value={settings.riskManagement.stopLossPercentage}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      riskManagement: { ...prev.riskManagement, stopLossPercentage: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Daily Loss Limit (USD)
                  </label>
                  <input
                    type="number"
                    value={settings.riskManagement.dailyLossLimit}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      riskManagement: { ...prev.riskManagement, dailyLossLimit: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maximum Leverage
                  </label>
                  <input
                    type="number"
                    value={settings.riskManagement.leverageLimit}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      riskManagement: { ...prev.riskManagement, leverageLimit: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="bg-white p-6 rounded-lg shadow mt-4">
              <h2 className="text-xl font-bold mb-4">Notifications</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: e.target.checked }
                    }))}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Email Notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.telegram}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, telegram: e.target.checked }
                    }))}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Telegram Notifications
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Discord Webhook URL
                  </label>
                  <input
                    type="text"
                    value={settings.notifications.discordWebhook}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, discordWebhook: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <div className="flex space-x-4">
        <button
          type="submit"
          onClick={handleSubmit}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </button>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default Settings;