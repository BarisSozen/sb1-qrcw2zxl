/*
  # Add Statistical Bot Type

  1. Changes
    - Update bot_configs type check constraint to include 'statistical' type
*/

ALTER TABLE bot_configs
DROP CONSTRAINT IF EXISTS bot_configs_type_check;

ALTER TABLE bot_configs
ADD CONSTRAINT bot_configs_type_check 
CHECK (type = ANY (ARRAY['basis'::text, 'perpetual'::text, 'dex'::text, 'statistical'::text]));