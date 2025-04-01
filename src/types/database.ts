export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          email: string
          wallet_address: string | null
          created_at: string | null
          active: boolean | null
          commission_rate: number
          total_invested: number | null
          current_balance: number | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          wallet_address?: string | null
          created_at?: string | null
          active?: boolean | null
          commission_rate?: number
          total_invested?: number | null
          current_balance?: number | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          wallet_address?: string | null
          created_at?: string | null
          active?: boolean | null
          commission_rate?: number
          total_invested?: number | null
          current_balance?: number | null
        }
      }
      exchange_api_keys: {
        Row: {
          id: string
          client_id: string
          exchange: 'binance' | 'bybit' | 'okx' | 'deribit'
          api_key: string
          api_secret: string
          passphrase: string | null
          created_at: string | null
          updated_at: string | null
          active: boolean | null
        }
        Insert: {
          id?: string
          client_id: string
          exchange: 'binance' | 'bybit' | 'okx' | 'deribit'
          api_key: string
          api_secret: string
          passphrase?: string | null
          created_at?: string | null
          updated_at?: string | null
          active?: boolean | null
        }
        Update: {
          id?: string
          client_id?: string
          exchange?: 'binance' | 'bybit' | 'okx' | 'deribit'
          api_key?: string
          api_secret?: string
          passphrase?: string | null
          created_at?: string | null
          updated_at?: string | null
          active?: boolean | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}