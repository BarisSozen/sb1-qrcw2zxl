/*
  # Add client relationship to bots

  1. Changes
    - Add client_id column to bot_configs table
    - Add foreign key constraint to link bots with clients
    - Add subaccount_id and wallet_address columns for trade execution
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to bot_configs table
ALTER TABLE bot_configs
ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN subaccount_id TEXT,
ADD COLUMN wallet_address TEXT;

-- Add index for client_id for better query performance
CREATE INDEX idx_bot_configs_client_id ON bot_configs(client_id);

-- Add index for status and client_id combination
CREATE INDEX idx_bot_configs_status_client ON bot_configs(status, client_id);