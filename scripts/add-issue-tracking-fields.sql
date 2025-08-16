-- Migration script to add issue tracking fields to production_data table
-- Run this in Supabase SQL Editor

-- Add issue tracking columns to production_data table
ALTER TABLE production_data
ADD COLUMN IF NOT EXISTS issue_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS severity_level VARCHAR(20),
ADD COLUMN IF NOT EXISTS actions_taken TEXT[], -- Array of action codes
ADD COLUMN IF NOT EXISTS root_cause TEXT,
ADD COLUMN IF NOT EXISTS parts_replaced TEXT,
ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS safety_concern BOOLEAN DEFAULT FALSE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_production_data_issue_category 
ON production_data(issue_category);

CREATE INDEX IF NOT EXISTS idx_production_data_severity_level 
ON production_data(severity_level);

CREATE INDEX IF NOT EXISTS idx_production_data_follow_up 
ON production_data(follow_up_required) 
WHERE follow_up_required = TRUE;

CREATE INDEX IF NOT EXISTS idx_production_data_safety 
ON production_data(safety_concern) 
WHERE safety_concern = TRUE;

-- Add check constraint for valid severity levels
ALTER TABLE production_data
DROP CONSTRAINT IF EXISTS check_severity_level;

ALTER TABLE production_data
ADD CONSTRAINT check_severity_level 
CHECK (severity_level IN ('critical', 'major', 'minor') OR severity_level IS NULL);

-- Add check constraint for valid issue categories
ALTER TABLE production_data
DROP CONSTRAINT IF EXISTS check_issue_category;

ALTER TABLE production_data
ADD CONSTRAINT check_issue_category 
CHECK (issue_category IN (
  'die_tooling',
  'material_feed', 
  'hydraulic_pressure',
  'quality_defect',
  'electrical_sensor',
  'setup_changeover',
  'maintenance',
  'machine_overload',
  'component_failure',
  'other'
) OR issue_category IS NULL);

-- Add comment to describe the new columns
COMMENT ON COLUMN production_data.issue_category IS 'Category of production issue encountered';
COMMENT ON COLUMN production_data.severity_level IS 'Severity: critical (stopped), major (slowed), minor (no impact)';
COMMENT ON COLUMN production_data.actions_taken IS 'Array of actions taken to address the issue';
COMMENT ON COLUMN production_data.root_cause IS 'Root cause analysis of the issue';
COMMENT ON COLUMN production_data.parts_replaced IS 'Parts that were replaced to fix the issue';
COMMENT ON COLUMN production_data.follow_up_required IS 'Whether follow-up action is needed';
COMMENT ON COLUMN production_data.safety_concern IS 'Whether this issue involves safety concerns';

-- Create a view for issues requiring attention
CREATE OR REPLACE VIEW production_issues_pending AS
SELECT 
  pd.*,
  m.machine_number,
  s.shift_name,
  p.part_number
FROM production_data pd
LEFT JOIN machines m ON pd.machine_id = m.id
LEFT JOIN shifts s ON pd.shift_id = s.id
LEFT JOIN parts p ON pd.part_id = p.id
WHERE 
  (pd.follow_up_required = TRUE 
   OR pd.safety_concern = TRUE
   OR pd.severity_level = 'critical')
  AND pd.date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY 
  pd.safety_concern DESC,
  pd.severity_level DESC,
  pd.date DESC;

-- Grant permissions for the view
GRANT SELECT ON production_issues_pending TO authenticated;
GRANT SELECT ON production_issues_pending TO anon;