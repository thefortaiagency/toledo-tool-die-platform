-- Create inventory adjustments table
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id SERIAL PRIMARY KEY,
  adjustment_date DATE NOT NULL,
  part_number VARCHAR(100) NOT NULL,
  part_name VARCHAR(255),
  operation VARCHAR(255),
  original_quantity DECIMAL(15, 3),
  adjusted_quantity DECIMAL(15, 3),
  adjustment_amount DECIMAL(15, 3) NOT NULL,
  adjustment_type VARCHAR(20) CHECK (adjustment_type IN ('increase', 'decrease')),
  extended_cost DECIMAL(15, 2),
  unit_cost DECIMAL(15, 4),
  adjustment_reason TEXT,
  location VARCHAR(100),
  part_group VARCHAR(100),
  adjusted_by VARCHAR(100),
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_date ON inventory_adjustments(adjustment_date);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_part ON inventory_adjustments(part_number);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_reason ON inventory_adjustments(adjustment_reason);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_type ON inventory_adjustments(adjustment_type);

-- Create summary table for faster aggregations
CREATE TABLE IF NOT EXISTS inventory_adjustment_summary (
  id SERIAL PRIMARY KEY,
  summary_date DATE UNIQUE NOT NULL,
  total_adjustments INTEGER,
  total_increases INTEGER,
  total_decreases INTEGER,
  net_quantity_change DECIMAL(15, 3),
  total_cost_impact DECIMAL(15, 2),
  top_part_number VARCHAR(100),
  top_adjustment_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create monthly summary view
CREATE OR REPLACE VIEW inventory_adjustment_monthly AS
SELECT 
  DATE_TRUNC('month', adjustment_date) as month,
  COUNT(*) as total_adjustments,
  SUM(CASE WHEN adjustment_type = 'increase' THEN 1 ELSE 0 END) as increases,
  SUM(CASE WHEN adjustment_type = 'decrease' THEN 1 ELSE 0 END) as decreases,
  SUM(CASE WHEN adjustment_type = 'increase' THEN adjustment_amount ELSE -adjustment_amount END) as net_quantity_change,
  SUM(ABS(extended_cost)) as total_cost_impact
FROM inventory_adjustments
GROUP BY DATE_TRUNC('month', adjustment_date)
ORDER BY month DESC;

-- Create top parts view
CREATE OR REPLACE VIEW inventory_top_parts AS
SELECT 
  part_number,
  MAX(part_name) as part_name,
  COUNT(*) as adjustment_count,
  SUM(CASE WHEN adjustment_type = 'increase' THEN adjustment_amount ELSE -adjustment_amount END) as net_quantity_change,
  SUM(ABS(extended_cost)) as total_cost_impact
FROM inventory_adjustments
GROUP BY part_number
ORDER BY adjustment_count DESC
LIMIT 50;

-- Create adjustment reasons view
CREATE OR REPLACE VIEW inventory_adjustment_reasons AS
SELECT 
  COALESCE(adjustment_reason, 'Not specified') as reason,
  COUNT(*) as count,
  SUM(CASE WHEN adjustment_type = 'increase' THEN adjustment_amount ELSE -adjustment_amount END) as net_quantity_change,
  SUM(ABS(extended_cost)) as total_cost_impact,
  ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM inventory_adjustments)), 2) as percentage
FROM inventory_adjustments
GROUP BY adjustment_reason
ORDER BY count DESC;