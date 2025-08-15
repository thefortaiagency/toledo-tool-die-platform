-- Toledo Tool & Die Production Metrics Database Schema
-- Created by NEXUS Platform Automation
-- Date: 2025-08-15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Machines table
CREATE TABLE IF NOT EXISTS machines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  machine_number VARCHAR(50) UNIQUE NOT NULL,
  machine_name VARCHAR(100),
  tonnage INTEGER,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Parts table
CREATE TABLE IF NOT EXISTS parts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  part_number VARCHAR(100) UNIQUE NOT NULL,
  part_name VARCHAR(200),
  customer VARCHAR(100),
  target_efficiency DECIMAL(5,2),
  cycle_time DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Operators table
CREATE TABLE IF NOT EXISTS operators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  shift VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  shift_name VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Production data table (main data entry)
CREATE TABLE IF NOT EXISTS production_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  shift_id UUID REFERENCES shifts(id),
  machine_id UUID REFERENCES machines(id),
  part_id UUID REFERENCES parts(id),
  operator_id UUID REFERENCES operators(id),
  
  -- Production metrics
  total_cycles INTEGER DEFAULT 0,
  good_parts INTEGER DEFAULT 0,
  scrap_parts INTEGER DEFAULT 0,
  downtime_minutes INTEGER DEFAULT 0,
  
  -- Efficiency calculations
  quoted_efficiency DECIMAL(5,2),
  actual_efficiency DECIMAL(5,2),
  
  -- Operating hours
  scheduled_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  
  -- Comments and notes
  operator_comments TEXT,
  supervisor_comments TEXT,
  
  -- Manning status
  manning_status VARCHAR(20), -- 'Have', 'Need', 'Call-in', 'NCNS', 'PTO'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Unique constraint to prevent duplicate entries
  UNIQUE(date, shift_id, machine_id)
);

-- Efficiency metrics table (calculated/aggregated data)
CREATE TABLE IF NOT EXISTS efficiency_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  period_type VARCHAR(20), -- 'daily', 'weekly', 'monthly'
  machine_id UUID REFERENCES machines(id),
  shift_id UUID REFERENCES shifts(id),
  
  -- Aggregated metrics
  total_cycles INTEGER DEFAULT 0,
  total_good_parts INTEGER DEFAULT 0,
  total_scrap_parts INTEGER DEFAULT 0,
  total_downtime_minutes INTEGER DEFAULT 0,
  
  -- Efficiency percentages
  average_efficiency DECIMAL(5,2),
  target_efficiency DECIMAL(5,2),
  efficiency_variance DECIMAL(5,2),
  
  -- Performance indicators
  oee_availability DECIMAL(5,2),
  oee_performance DECIMAL(5,2),
  oee_quality DECIMAL(5,2),
  oee_overall DECIMAL(5,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(date, period_type, machine_id, shift_id)
);

-- Hits tracking table (from Hits Tracking 2025.xlsx)
CREATE TABLE IF NOT EXISTS hits_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  machine_id UUID REFERENCES machines(id),
  day_of_week VARCHAR(10),
  
  -- Daily hit counts
  monday_hits INTEGER,
  tuesday_hits INTEGER,
  wednesday_hits INTEGER,
  thursday_hits INTEGER,
  friday_hits INTEGER,
  saturday_hits INTEGER,
  sunday_hits INTEGER,
  
  -- Weekly totals
  weekly_total INTEGER,
  weekly_average DECIMAL(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(date, machine_id)
);

-- Shift reports table (from Shift Update files)
CREATE TABLE IF NOT EXISTS shift_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_date DATE NOT NULL,
  report_version VARCHAR(20),
  shift_number INTEGER,
  
  -- Key metrics from report
  total_press_strokes INTEGER,
  overall_efficiency DECIMAL(5,2),
  
  -- Manning summary
  manning_have INTEGER,
  manning_need INTEGER,
  manning_callins INTEGER,
  manning_ncns INTEGER,
  manning_pto INTEGER,
  
  -- Raw data storage
  raw_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  UNIQUE(report_date, shift_number)
);

-- AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  insight_date DATE NOT NULL,
  insight_type VARCHAR(50), -- 'anomaly', 'prediction', 'recommendation'
  severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  
  -- Related entities
  machine_id UUID REFERENCES machines(id),
  part_id UUID REFERENCES parts(id),
  operator_id UUID REFERENCES operators(id),
  
  -- Insight details
  title VARCHAR(200),
  description TEXT,
  recommendation TEXT,
  confidence_score DECIMAL(3,2),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'new', -- 'new', 'reviewed', 'acted_upon', 'dismissed'
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX idx_production_data_date ON production_data(date);
CREATE INDEX idx_production_data_machine ON production_data(machine_id);
CREATE INDEX idx_production_data_shift ON production_data(shift_id);
CREATE INDEX idx_production_data_part ON production_data(part_id);
CREATE INDEX idx_efficiency_metrics_date ON efficiency_metrics(date);
CREATE INDEX idx_efficiency_metrics_machine ON efficiency_metrics(machine_id);
CREATE INDEX idx_ai_insights_date ON ai_insights(insight_date);
CREATE INDEX idx_ai_insights_status ON ai_insights(status);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables with updated_at
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operators_updated_at BEFORE UPDATE ON operators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_data_updated_at BEFORE UPDATE ON production_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_efficiency_metrics_updated_at BEFORE UPDATE ON efficiency_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_reports_updated_at BEFORE UPDATE ON shift_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON ai_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default shifts
INSERT INTO shifts (shift_name, start_time, end_time) VALUES
  ('First', '06:00:00', '14:00:00'),
  ('Second', '14:00:00', '22:00:00'),
  ('Third', '22:00:00', '06:00:00')
ON CONFLICT DO NOTHING;

-- Insert sample machines from the Excel data
INSERT INTO machines (machine_number, machine_name, tonnage) VALUES
  ('600', '600 Ton Press', 600),
  ('1000', '1000 Ton Press', 1000),
  ('1400', '1400 Ton Press', 1400),
  ('1500-1', '1500 Ton Press #1', 1500),
  ('1500-2', '1500 Ton Press #2', 1500),
  ('3000', '3000 Ton Press', 3000)
ON CONFLICT (machine_number) DO NOTHING;

-- Grant permissions (adjust based on your Supabase setup)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;