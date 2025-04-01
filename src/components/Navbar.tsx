import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LineChart, 
  Settings, 
  Shield, 
  Users, 
  Activity, 
  Bot,
  DollarSign,
  Menu,
  X
} from 'lucide-react';

export const Navbar = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/trades', name: 'Trades', icon: LineChart },
    { path: '/clients', name: 'Clients', icon: Users },
    { path: '/risk-report', name: 'Risk Report', icon: Shield },
    { path: '/bot-performance', name: 'Bot Performance', icon: Activity },
    { path: '/bot-management', name: 'Bot Management', icon: Bot },
    { path: '/sales-commission', name: 'Sales Commission', icon: DollarSign },
    { path: '/settings', name: 'Settings', icon: Settings },
  ];

  if (isLandingPage) {
    return (
      <nav className="bg-transparent absolute w-full">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-lg font-semibold text-white">
              Dow Digital
            </Link>
            <div className="flex space-x-4">
              <Link 
                to="/dashboard" 
                className="px-4 py-2 text-white hover:text-accent transition-colors"
              >
                Launch App
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md bg-white shadow-lg"
        >
          {isSidebarOpen ? (
            <X className="w-6 h-6 text-gray-600" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 transform ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      } lg:translate-x-0 transition-transform duration-200 ease-in-out z-30`}>
        <div className="flex flex-col h-full w-64 bg-white border-l border-gray-200">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link to="/" className="text-xl font-semibold text-brand">
              Dow Digital
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};