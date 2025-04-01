from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
from dotenv import load_dotenv
from binance.client import Client
from web3 import Web3

load_dotenv()

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Binance client
binance_client = Client(
    os.getenv('BINANCE_API_KEY'),
    os.getenv('BINANCE_API_SECRET')
)

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(os.getenv('ETH_NODE_URL')))

class ArbitrageOpportunity(BaseModel):
    exchange_pair: str
    price_difference: float
    potential_profit: float
    timestamp: int

@app.get("/")
async def root():
    return {"message": "Crypto Arbitrage API"}

@app.get("/opportunities", response_model=List[ArbitrageOpportunity])
async def get_arbitrage_opportunities():
    try:
        # This is a placeholder. Implement actual arbitrage detection logic here
        opportunities = [
            {
                "exchange_pair": "Binance/Uniswap",
                "price_difference": 0.15,
                "potential_profit": 123.45,
                "timestamp": 1625097600
            }
        ]
        return opportunities
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/balances")
async def get_balances():
    try:
        # Get Binance balance
        binance_balance = binance_client.get_account()
        
        # Get ETH balance
        eth_balance = w3.eth.get_balance(os.getenv('ETH_WALLET_ADDRESS'))
        
        return {
            "binance": binance_balance,
            "ethereum": w3.from_wei(eth_balance, 'ether')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))