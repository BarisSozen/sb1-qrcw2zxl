# Crypto Arbitrage Platform

A professional crypto arbitrage trading platform built with React, TypeScript, and Supabase.

## Features

- Real-time arbitrage opportunity detection across multiple exchanges
- Multi-exchange support (Binance, Bybit, OKX, Deribit)
- Advanced risk management system
- Performance analytics and reporting
- Client portfolio management
- Secure API key management
- Automated trading execution
- Real-time market data monitoring

## Tech Stack

- React 18
- TypeScript 5
- Tailwind CSS
- Supabase
- Vite
- React Query
- React Router
- Recharts
- Web3 Integration

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/BarisSozen/BOLT_ARB.git
   cd BOLT_ARB
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Setup

Required environment variables:

\`\`\`env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Exchange API Keys
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
BYBIT_API_KEY=your_bybit_api_key
BYBIT_API_SECRET=your_bybit_api_secret
OKX_API_KEY=your_okx_api_key
OKX_API_SECRET=your_okx_api_secret
OKX_PASSPHRASE=your_okx_passphrase
DERIBIT_API_KEY=your_deribit_api_key
DERIBIT_API_SECRET=your_deribit_api_secret

# Ethereum Node
ETH_NODE_URL=your_ethereum_node_url
ETH_WALLET_ADDRESS=your_ethereum_wallet_address
ETH_PRIVATE_KEY=your_ethereum_private_key
\`\`\`

## Project Structure

\`\`\`
src/
  ├── components/     # Reusable UI components
  ├── hooks/         # Custom React hooks
  ├── pages/         # Page components
  │   ├── Dashboard/   # Main dashboard
  │   ├── Trades/      # Trading history
  │   ├── Clients/     # Client management
  │   ├── Settings/    # Platform settings
  │   └── Reports/     # Risk and performance reports
  ├── services/      # Business logic and API integration
  │   ├── exchanges/   # Exchange-specific implementations
  │   ├── security/    # Security and risk management
  │   └── arbitrage/   # Arbitrage detection and execution
  ├── lib/           # Utility functions and configurations
  └── main.tsx       # Application entry point

supabase/
  └── migrations/    # Database migrations
\`\`\`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.