import React from 'react';
import { ArrowRight, LineChart, Shield, BrainCircuit, Sigma } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-brand">
      {/* Hero Section */}
      <div 
        className="relative min-h-screen flex items-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1635070041078-e363dbe005cb")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-brand/90 to-brand/70" />
        
        <div className="container mx-auto px-6 relative z-10 pt-20">
          <div className="max-w-3xl">
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
              Dow Digital Capital
              <span className="block text-4xl mt-4">Quantitative Trading</span>
              <span className="block text-accent mt-2">Redefined</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Harness the power of advanced mathematical models and real-time data analysis 
              to execute sophisticated arbitrage strategies across multiple exchanges.
            </p>
            <div className="flex gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center px-8 py-4 text-lg font-medium text-brand bg-accent hover:bg-accent-300 transition-colors"
              >
                Launch App
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center px-8 py-4 text-lg font-medium text-white border-2 border-white/20 rounded-lg hover:bg-white/10 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-brand-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-accent">
            Powered by Advanced Mathematics
          </h2>
          <p className="text-xl text-center text-gray-300 mb-12 max-w-2xl mx-auto">
            Our platform leverages sophisticated mathematical models and statistical analysis 
            to identify and execute profitable trading opportunities.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-brand rounded-lg p-8 border border-accent/20">
              <Sigma className="h-12 w-12 text-accent mb-6" />
              <h3 className="text-xl font-semibold text-white mb-4">
                Statistical Arbitrage
              </h3>
              <p className="text-gray-300">
                Utilize advanced statistical methods to identify price discrepancies 
                and execute trades with mathematical precision.
              </p>
            </div>
            
            <div className="bg-brand rounded-lg p-8 border border-accent/20">
              <BrainCircuit className="h-12 w-12 text-accent mb-6" />
              <h3 className="text-xl font-semibold text-white mb-4">
                Machine Learning Models
              </h3>
              <p className="text-gray-300">
                Employ sophisticated ML algorithms to predict market movements and 
                optimize trading strategies in real-time.
              </p>
            </div>
            
            <div className="bg-brand rounded-lg p-8 border border-accent/20">
              <LineChart className="h-12 w-12 text-accent mb-6" />
              <h3 className="text-xl font-semibold text-white mb-4">
                Real-time Analytics
              </h3>
              <p className="text-gray-300">
                Monitor and analyze market data across multiple exchanges with 
                millisecond precision for optimal execution.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="py-20 bg-brand">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-brand-800 rounded-lg border border-accent/20">
              <div className="text-5xl font-bold text-accent mb-4">$1M+</div>
              <div className="text-xl text-gray-300">Daily Trading Volume</div>
            </div>
            
            <div className="text-center p-8 bg-brand-800 rounded-lg border border-accent/20">
              <div className="text-5xl font-bold text-accent mb-4">99.9%</div>
              <div className="text-xl text-gray-300">System Uptime</div>
            </div>
            
            <div className="text-center p-8 bg-brand-800 rounded-lg border border-accent/20">
              <div className="text-5xl font-bold text-accent mb-4">0.5s</div>
              <div className="text-xl text-gray-300">Average Execution Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-brand-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-accent mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join our platform today and access professional-grade quantitative trading tools.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-8 py-4 text-lg font-medium text-brand bg-accent hover:bg-accent-300 transition-colors"
          >
            Launch App
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;