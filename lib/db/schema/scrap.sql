-- Scrap Data Table Schema
CREATE TABLE IF NOT EXISTS scrap_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  part_number_revision VARCHAR(150) NOT NULL, -- Combined part and revision
  part_number VARCHAR(100),
  revision VARCHAR(20),
  operation VARCHAR(100),
  quantity DECIMAL(12,3) NOT NULL DEFAULT 0, -- Some quantities have decimals
  reason_code VARCHAR(100), -- Empty for now but kept for future
  workcenter VARCHAR(50),
  unit_cost DECIMAL(10,2) DEFAULT 0,
  extended_cost DECIMAL(12,2) DEFAULT 0,
  month VARCHAR(7), -- Format: YYYY-MM
  source_sheet VARCHAR(50), -- Track which sheet it came from
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_scrap_data_month ON scrap_data(month);
CREATE INDEX idx_scrap_data_part_number ON scrap_data(part_number);
CREATE INDEX idx_scrap_data_workcenter ON scrap_data(workcenter);
CREATE INDEX idx_scrap_data_reason_code ON scrap_data(reason_code);
CREATE INDEX idx_scrap_data_quantity ON scrap_data(quantity DESC);

-- Scrap Reason Codes Reference Table
CREATE TABLE IF NOT EXISTS scrap_reason_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50), -- e.g., 'Setup', 'Quality', 'Machine', 'Operator'
  severity VARCHAR(20), -- e.g., 'Low', 'Medium', 'High', 'Critical'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common reason codes from the Excel data
INSERT INTO scrap_reason_codes (code, description, category, severity) VALUES
  ('Start or End of Coil', 'Material waste at coil start/end', 'Setup', 'Low'),
  ('Set Up Parts', 'Parts scrapped during machine setup', 'Setup', 'Low'),
  ('1st Pc Insp-Stamping', 'First piece inspection failure in stamping', 'Quality', 'Medium'),
  ('Die Repair', 'Parts scrapped due to die issues', 'Machine', 'High'),
  ('Over Run', 'Excess production beyond requirement', 'Operator', 'Low'),
  ('Die Set', 'Issues with die setup', 'Setup', 'Medium'),
  ('NG-Broken Punch/Button', 'Broken tooling components', 'Machine', 'Critical'),
  ('Progression', 'Progressive die issues', 'Machine', 'High'),
  ('Wrong Material', 'Incorrect material used', 'Operator', 'Critical'),
  ('End Cut', 'Material waste from cutting operations', 'Setup', 'Low')
ON CONFLICT (code) DO NOTHING;

-- Efficiency Metrics View
CREATE OR REPLACE VIEW scrap_efficiency_metrics AS
SELECT 
  month,
  workcenter,
  SUM(quantity) as total_scrap,
  SUM(extended_cost) as total_cost,
  COUNT(DISTINCT part_number) as unique_parts,
  COUNT(DISTINCT reason_code) as unique_reasons,
  COUNT(*) as total_records,
  AVG(quantity) as avg_scrap_per_record
FROM scrap_data
GROUP BY month, workcenter
ORDER BY month DESC, total_scrap DESC;