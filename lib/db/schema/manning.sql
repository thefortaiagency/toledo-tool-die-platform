-- Manning/Attendance tracking tables for Toledo Tool & Die

-- Table for employee shift assignments and attendance
CREATE TABLE IF NOT EXISTS manning_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  shift_id UUID REFERENCES shifts(id),
  employee_id UUID REFERENCES operators(id),
  employee_name VARCHAR(255),
  machine_id UUID REFERENCES machines(id),
  machine_number VARCHAR(50),
  
  -- Attendance data
  scheduled_start TIME,
  scheduled_end TIME,
  actual_start TIME,
  actual_end TIME,
  hours_scheduled DECIMAL(4,2),
  hours_worked DECIMAL(4,2),
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  
  -- Status
  attendance_status VARCHAR(50) CHECK (attendance_status IN ('present', 'absent', 'late', 'early_departure', 'partial', 'holiday', 'vacation', 'sick')),
  is_temp_operator BOOLEAN DEFAULT FALSE,
  
  -- Performance metrics (linked to production)
  production_efficiency DECIMAL(5,2),
  parts_produced INTEGER,
  quality_score DECIMAL(5,2),
  
  -- Notes
  notes TEXT,
  supervisor_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  imported_from VARCHAR(255), -- Excel filename if imported
  
  -- Indexes for common queries
  CONSTRAINT unique_employee_date_shift UNIQUE (date, shift_id, employee_id)
);

-- Create indexes for performance
CREATE INDEX idx_manning_date ON manning_records(date);
CREATE INDEX idx_manning_shift ON manning_records(shift_id);
CREATE INDEX idx_manning_employee ON manning_records(employee_id);
CREATE INDEX idx_manning_machine ON manning_records(machine_id);
CREATE INDEX idx_manning_status ON manning_records(attendance_status);
CREATE INDEX idx_manning_date_shift ON manning_records(date, shift_id);

-- Table for shift summary statistics
CREATE TABLE IF NOT EXISTS shift_manning_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  shift_id UUID REFERENCES shifts(id),
  shift_name VARCHAR(50),
  
  -- Manning counts
  total_scheduled INTEGER,
  total_present INTEGER,
  total_absent INTEGER,
  total_late INTEGER,
  temp_operators INTEGER,
  
  -- Hours
  total_hours_scheduled DECIMAL(6,2),
  total_hours_worked DECIMAL(6,2),
  total_overtime_hours DECIMAL(6,2),
  
  -- Coverage metrics
  manning_percentage DECIMAL(5,2), -- (present/scheduled) * 100
  coverage_score DECIMAL(5,2), -- Factor in temps and overtime
  
  -- Production impact
  avg_efficiency DECIMAL(5,2),
  total_parts_produced INTEGER,
  
  -- Notes
  issues TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_date_shift_summary UNIQUE (date, shift_id)
);

-- Create view for current manning status
CREATE OR REPLACE VIEW current_manning AS
SELECT 
  m.*,
  o.name as operator_name,
  o.employee_id as operator_employee_id,
  s.shift_name,
  s.start_time as shift_start,
  s.end_time as shift_end,
  mc.machine_name,
  CASE 
    WHEN m.attendance_status = 'present' THEN 'Present ✓'
    WHEN m.attendance_status = 'absent' THEN 'Absent ✗'
    WHEN m.attendance_status = 'late' THEN 'Late ⚠'
    ELSE m.attendance_status
  END as status_display
FROM manning_records m
LEFT JOIN operators o ON m.employee_id = o.id
LEFT JOIN shifts s ON m.shift_id = s.id
LEFT JOIN machines mc ON m.machine_id = mc.id
WHERE m.date = CURRENT_DATE;

-- Create view for attendance trends
CREATE OR REPLACE VIEW attendance_trends AS
SELECT 
  date_trunc('week', date) as week,
  shift_id,
  COUNT(*) as total_records,
  SUM(CASE WHEN attendance_status = 'present' THEN 1 ELSE 0 END) as present_count,
  SUM(CASE WHEN attendance_status = 'absent' THEN 1 ELSE 0 END) as absent_count,
  SUM(CASE WHEN attendance_status = 'late' THEN 1 ELSE 0 END) as late_count,
  AVG(hours_worked) as avg_hours_worked,
  SUM(overtime_hours) as total_overtime,
  AVG(production_efficiency) as avg_efficiency
FROM manning_records
GROUP BY date_trunc('week', date), shift_id
ORDER BY week DESC;

-- Create function to calculate manning metrics
CREATE OR REPLACE FUNCTION calculate_manning_metrics(
  p_date DATE,
  p_shift_id UUID
) RETURNS TABLE (
  manning_score DECIMAL,
  attendance_rate DECIMAL,
  overtime_rate DECIMAL,
  efficiency_impact DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      (COUNT(CASE WHEN attendance_status = 'present' THEN 1 END)::DECIMAL / 
       NULLIF(COUNT(*)::DECIMAL, 0)) * 100, 
      0
    ) as manning_score,
    COALESCE(
      (COUNT(CASE WHEN attendance_status IN ('present', 'late') THEN 1 END)::DECIMAL / 
       NULLIF(COUNT(*)::DECIMAL, 0)) * 100,
      0
    ) as attendance_rate,
    COALESCE(
      (SUM(overtime_hours) / NULLIF(SUM(hours_worked), 0)) * 100,
      0
    ) as overtime_rate,
    COALESCE(AVG(production_efficiency), 0) as efficiency_impact
  FROM manning_records
  WHERE date = p_date 
    AND (p_shift_id IS NULL OR shift_id = p_shift_id);
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update manning summary automatically
CREATE OR REPLACE FUNCTION update_manning_summary() RETURNS TRIGGER AS $$
BEGIN
  -- Delete existing summary for this date/shift
  DELETE FROM shift_manning_summary 
  WHERE date = NEW.date AND shift_id = NEW.shift_id;
  
  -- Insert new summary
  INSERT INTO shift_manning_summary (
    date, shift_id, shift_name,
    total_scheduled, total_present, total_absent, total_late, temp_operators,
    total_hours_scheduled, total_hours_worked, total_overtime_hours,
    manning_percentage, avg_efficiency, total_parts_produced
  )
  SELECT 
    NEW.date,
    NEW.shift_id,
    s.shift_name,
    COUNT(*),
    COUNT(CASE WHEN attendance_status = 'present' THEN 1 END),
    COUNT(CASE WHEN attendance_status = 'absent' THEN 1 END),
    COUNT(CASE WHEN attendance_status = 'late' THEN 1 END),
    COUNT(CASE WHEN is_temp_operator = true THEN 1 END),
    SUM(hours_scheduled),
    SUM(hours_worked),
    SUM(overtime_hours),
    (COUNT(CASE WHEN attendance_status = 'present' THEN 1 END)::DECIMAL / 
     NULLIF(COUNT(*)::DECIMAL, 0)) * 100,
    AVG(production_efficiency),
    SUM(parts_produced)
  FROM manning_records m
  JOIN shifts s ON m.shift_id = s.id
  WHERE m.date = NEW.date AND m.shift_id = NEW.shift_id
  GROUP BY s.shift_name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_manning_summary_trigger
AFTER INSERT OR UPDATE OR DELETE ON manning_records
FOR EACH ROW EXECUTE FUNCTION update_manning_summary();