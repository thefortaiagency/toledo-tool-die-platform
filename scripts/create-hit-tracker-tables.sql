-- Create hit_tracker table for production data
CREATE TABLE IF NOT EXISTS hit_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  machine VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  shift INTEGER CHECK (shift >= 1 AND shift <= 3),
  hits INTEGER NOT NULL,
  efficiency DECIMAL(5,2),
  downtime_minutes INTEGER DEFAULT 0,
  operator VARCHAR(100),
  part_number VARCHAR(100),
  comments TEXT,
  oee DECIMAL(5,2),
  source VARCHAR(50) DEFAULT 'MANUAL',
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  update_source VARCHAR(50),
  
  -- Create indexes for common queries
  CONSTRAINT unique_machine_date_shift UNIQUE (machine, date, shift)
);

-- Create indexes for performance
CREATE INDEX idx_hit_tracker_machine ON hit_tracker(machine);
CREATE INDEX idx_hit_tracker_date ON hit_tracker(date DESC);
CREATE INDEX idx_hit_tracker_shift ON hit_tracker(shift);
CREATE INDEX idx_hit_tracker_machine_date ON hit_tracker(machine, date DESC);

-- Create OEE metrics table
CREATE TABLE IF NOT EXISTS oee_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  machine VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  availability DECIMAL(5,2) NOT NULL CHECK (availability >= 0 AND availability <= 100),
  performance DECIMAL(5,2) NOT NULL CHECK (performance >= 0 AND performance <= 100),
  quality DECIMAL(5,2) NOT NULL CHECK (quality >= 0 AND quality <= 100),
  oee DECIMAL(5,2) NOT NULL CHECK (oee >= 0 AND oee <= 100),
  world_class_gap DECIMAL(5,2),
  source VARCHAR(50) DEFAULT 'CALCULATED',
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one OEE record per machine per day
  CONSTRAINT unique_machine_date_oee UNIQUE (machine, date)
);

-- Create indexes for OEE metrics
CREATE INDEX idx_oee_metrics_machine ON oee_metrics(machine);
CREATE INDEX idx_oee_metrics_date ON oee_metrics(date DESC);
CREATE INDEX idx_oee_metrics_oee ON oee_metrics(oee);

-- Create import_logs table to track all imports
CREATE TABLE IF NOT EXISTS import_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_type VARCHAR(50) NOT NULL,
  source VARCHAR(100) NOT NULL,
  records_attempted INTEGER NOT NULL,
  records_succeeded INTEGER NOT NULL,
  records_failed INTEGER DEFAULT 0,
  error_details JSONB,
  summary JSONB,
  imported_by VARCHAR(100),
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create view for daily production summary
CREATE OR REPLACE VIEW daily_production_summary AS
SELECT 
  date,
  machine,
  SUM(hits) as total_hits,
  AVG(efficiency) as avg_efficiency,
  SUM(downtime_minutes) as total_downtime,
  COUNT(DISTINCT shift) as shifts_run,
  AVG(oee) as avg_oee
FROM hit_tracker
GROUP BY date, machine
ORDER BY date DESC, machine;

-- Create view for machine performance trends
CREATE OR REPLACE VIEW machine_performance_trends AS
SELECT 
  machine,
  DATE_TRUNC('week', date) as week,
  AVG(efficiency) as weekly_avg_efficiency,
  SUM(hits) as weekly_total_hits,
  AVG(oee) as weekly_avg_oee,
  SUM(downtime_minutes) as weekly_downtime
FROM hit_tracker
GROUP BY machine, DATE_TRUNC('week', date)
ORDER BY machine, week DESC;

-- Create view for shift comparison
CREATE OR REPLACE VIEW shift_performance_comparison AS
SELECT 
  shift,
  AVG(efficiency) as avg_efficiency,
  AVG(hits) as avg_hits,
  AVG(oee) as avg_oee,
  COUNT(*) as total_shifts
FROM hit_tracker
GROUP BY shift
ORDER BY shift;

-- Create function to calculate OEE automatically
CREATE OR REPLACE FUNCTION calculate_oee()
RETURNS TRIGGER AS $$
BEGIN
  -- If OEE is not provided, calculate it
  IF NEW.oee IS NULL AND NEW.efficiency IS NOT NULL THEN
    -- Simple OEE calculation (can be customized)
    -- Assuming 85% availability and 97% quality as defaults
    NEW.oee := (0.85 * (NEW.efficiency / 100) * 0.97 * 100);
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate OEE
CREATE TRIGGER auto_calculate_oee
BEFORE INSERT OR UPDATE ON hit_tracker
FOR EACH ROW
EXECUTE FUNCTION calculate_oee();

-- Grant permissions (adjust based on your user roles)
GRANT SELECT, INSERT, UPDATE ON hit_tracker TO authenticated;
GRANT SELECT ON daily_production_summary TO authenticated;
GRANT SELECT ON machine_performance_trends TO authenticated;
GRANT SELECT ON shift_performance_comparison TO authenticated;
GRANT SELECT, INSERT ON oee_metrics TO authenticated;
GRANT SELECT, INSERT ON import_logs TO authenticated;