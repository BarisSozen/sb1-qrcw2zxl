/*
  # Add Commission Statistics View

  1. New Views
    - `commission_stats`
      - Aggregates commission data to calculate:
        - Total amount
        - Paid amount
        - Unpaid amount

  2. Changes
    - Creates a view to handle complex aggregations
    - Simplifies frontend queries
*/

CREATE VIEW commission_stats AS
SELECT
    COALESCE(SUM(amount), 0) as total_amount,
    COALESCE(SUM(CASE WHEN paid THEN amount ELSE 0 END), 0) as paid_amount,
    COALESCE(SUM(CASE WHEN NOT paid THEN amount ELSE 0 END), 0) as unpaid_amount
FROM
    commissions;