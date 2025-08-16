-- Add manning/attendance columns to production_data table
-- Run this in Supabase SQL Editor to add the new fields

-- Add manning columns if they don't exist
ALTER TABLE production_data 
ADD COLUMN IF NOT EXISTS operators_scheduled INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS operators_present INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS operators_absent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS temp_operators INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS overtime_hours DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS attendance_notes TEXT;

-- Create an index for manning queries
CREATE INDEX IF NOT EXISTS idx_production_manning ON production_data(operators_scheduled, operators_present);

-- Add a computed column for attendance rate (optional)
-- This creates a generated column that automatically calculates the attendance rate
ALTER TABLE production_data 
ADD COLUMN IF NOT EXISTS attendance_rate DECIMAL(5,2) GENERATED ALWAYS AS (
  CASE 
    WHEN operators_scheduled > 0 THEN (operators_present::DECIMAL / operators_scheduled::DECIMAL) * 100
    ELSE NULL
  END
) STORED;

-- Create a view for manning summary by shift
CREATE OR REPLACE VIEW shift_manning_overview AS
SELECT 
  date,
  shift_id,
  s.shift_name,
  COUNT(DISTINCT machine_id) as machines_operated,
  MAX(operators_scheduled) as max_operators_scheduled,
  MAX(operators_present) as max_operators_present,
  MAX(operators_absent) as max_operators_absent,
  SUM(temp_operators) as total_temp_operators,
  SUM(overtime_hours) as total_overtime_hours,
  AVG(CASE 
    WHEN operators_scheduled > 0 THEN (operators_present::DECIMAL / operators_scheduled::DECIMAL) * 100
    ELSE NULL
  END) as avg_attendance_rate,
  AVG(actual_efficiency) as avg_efficiency
FROM production_data pd
LEFT JOIN shifts s ON pd.shift_id = s.id
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date, shift_id, s.shift_name
ORDER BY date DESC, s.shift_name;

-- Create a function to get manning trends
CREATE OR REPLACE FUNCTION get_manning_trends(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  week_start DATE,
  avg_attendance_rate DECIMAL,
  avg_operators_scheduled DECIMAL,
  avg_operators_present DECIMAL,
  total_overtime_hours DECIMAL,
  weeks_ago INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('week', pd.date)::DATE as week_start,
    AVG(CASE 
      WHEN pd.operators_scheduled > 0 THEN (pd.operators_present::DECIMAL / pd.operators_scheduled::DECIMAL) * 100
      ELSE NULL
    END) as avg_attendance_rate,
    AVG(pd.operators_scheduled)::DECIMAL as avg_operators_scheduled,
    AVG(pd.operators_present)::DECIMAL as avg_operators_present,
    SUM(pd.overtime_hours)::DECIMAL as total_overtime_hours,
    EXTRACT(WEEK FROM AGE(CURRENT_DATE, pd.date))::INTEGER as weeks_ago
  FROM production_data pd
  WHERE pd.date >= CURRENT_DATE - INTERVAL '1 day' * days_back
  GROUP BY date_trunc('week', pd.date)
  ORDER BY week_start DESC;
END;
$$ LANGUAGE plpgsql;

-- Example query to use the new columns
-- SELECT 
--   date,
--   shift_name,
--   operators_scheduled,
--   operators_present,
--   attendance_rate,
--   overtime_hours,
--   manning_status,
--   attendance_notes
-- FROM production_data pd
-- JOIN shifts s ON pd.shift_id = s.id
-- WHERE date >= CURRENT_DATE - INTERVAL '7 days'
-- ORDER BY date DESC, s.shift_name;