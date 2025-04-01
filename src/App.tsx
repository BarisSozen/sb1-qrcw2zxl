import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Trades } from './pages/Trades';
import { Settings } from './pages/Settings';
import { RiskReport } from './pages/RiskReport';
import { BotPerformance } from './pages/BotPerformance';
import { BotManagement } from './pages/BotManagement';
import { SalesCommission } from './pages/SalesCommission';
import { Clients } from './pages/Clients';
import { Landing } from './pages/Landing';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-brand-50">
          <Navbar />
          <div className="lg:pr-64">
            <div className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/trades" element={<Trades />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/risk-report" element={<RiskReport />} />
                <Route path="/bot-performance" element={<BotPerformance />} />
                <Route path="/bot-management" element={<BotManagement />} />
                <Route path="/sales-commission" element={<SalesCommission />} />
                <Route path="/clients" element={<Clients />} />
              </Routes>
            </div>
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;