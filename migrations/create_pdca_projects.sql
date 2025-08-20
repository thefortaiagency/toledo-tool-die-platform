-- PDCA Project Management Schema
-- Created: 2025-08-20
-- Purpose: Store comprehensive project management data for PDCA improvement initiatives

-- Main project table
CREATE TABLE IF NOT EXISTS pdca_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    project_type VARCHAR(50), -- 'scrap_reduction', 'downtime_reduction', 'quality_improvement', etc.
    target_metric VARCHAR(100) NOT NULL,
    current_value DECIMAL(10,2) NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    project_manager VARCHAR(100),
    sponsor VARCHAR(100),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_end_date DATE NOT NULL,
    actual_end_date DATE,
    estimated_budget DECIMAL(10,2),
    actual_budget DECIMAL(10,2),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
    business_impact TEXT,
    status VARCHAR(30) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Success criteria for projects
CREATE TABLE IF NOT EXISTS pdca_success_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES pdca_projects(id) ON DELETE CASCADE,
    criteria_text TEXT NOT NULL,
    is_met BOOLEAN DEFAULT FALSE,
    met_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stakeholders table
CREATE TABLE IF NOT EXISTS pdca_stakeholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES pdca_projects(id) ON DELETE CASCADE,
    stakeholder_name VARCHAR(100) NOT NULL,
    role VARCHAR(100),
    department VARCHAR(100),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PDCA action items
CREATE TABLE IF NOT EXISTS pdca_action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES pdca_projects(id) ON DELETE CASCADE,
    phase VARCHAR(10) NOT NULL CHECK (phase IN ('plan', 'do', 'check', 'act')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignee VARCHAR(100),
    due_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    estimated_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2),
    cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Action item attachments
CREATE TABLE IF NOT EXISTS pdca_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_item_id UUID REFERENCES pdca_action_items(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,
    uploaded_by VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project milestones
CREATE TABLE IF NOT EXISTS pdca_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES pdca_projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    actual_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Milestone completion criteria
CREATE TABLE IF NOT EXISTS pdca_milestone_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID REFERENCES pdca_milestones(id) ON DELETE CASCADE,
    criteria_text TEXT NOT NULL,
    is_met BOOLEAN DEFAULT FALSE,
    met_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress updates
CREATE TABLE IF NOT EXISTS pdca_progress_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES pdca_projects(id) ON DELETE CASCADE,
    update_date DATE NOT NULL DEFAULT CURRENT_DATE,
    author VARCHAR(100) NOT NULL,
    summary TEXT,
    overall_progress INTEGER DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress achievements
CREATE TABLE IF NOT EXISTS pdca_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    progress_update_id UUID REFERENCES pdca_progress_updates(id) ON DELETE CASCADE,
    achievement_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress challenges
CREATE TABLE IF NOT EXISTS pdca_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    progress_update_id UUID REFERENCES pdca_progress_updates(id) ON DELETE CASCADE,
    challenge_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress next steps
CREATE TABLE IF NOT EXISTS pdca_next_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    progress_update_id UUID REFERENCES pdca_progress_updates(id) ON DELETE CASCADE,
    next_step_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_pdca_projects_status ON pdca_projects(status);
CREATE INDEX idx_pdca_projects_project_type ON pdca_projects(project_type);
CREATE INDEX idx_pdca_action_items_project_phase ON pdca_action_items(project_id, phase);
CREATE INDEX idx_pdca_action_items_status ON pdca_action_items(status);
CREATE INDEX idx_pdca_action_items_assignee ON pdca_action_items(assignee);
CREATE INDEX idx_pdca_milestones_project ON pdca_milestones(project_id);
CREATE INDEX idx_pdca_progress_project ON pdca_progress_updates(project_id);

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pdca_projects_modtime BEFORE UPDATE ON pdca_projects
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_pdca_action_items_modtime BEFORE UPDATE ON pdca_action_items
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_pdca_milestones_modtime BEFORE UPDATE ON pdca_milestones
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- View for project dashboard summary
CREATE VIEW pdca_project_summary AS
SELECT 
    p.id,
    p.project_id,
    p.project_name,
    p.project_type,
    p.status,
    p.start_date,
    p.target_end_date,
    p.risk_level,
    p.current_value,
    p.target_value,
    p.unit,
    COALESCE(action_stats.total_actions, 0) as total_actions,
    COALESCE(action_stats.completed_actions, 0) as completed_actions,
    COALESCE(action_stats.in_progress_actions, 0) as in_progress_actions,
    COALESCE(milestone_stats.total_milestones, 0) as total_milestones,
    COALESCE(milestone_stats.completed_milestones, 0) as completed_milestones,
    COALESCE(latest_update.overall_progress, 0) as overall_progress,
    latest_update.update_date as last_update_date
FROM pdca_projects p
LEFT JOIN (
    SELECT 
        project_id,
        COUNT(*) as total_actions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_actions,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_actions
    FROM pdca_action_items
    GROUP BY project_id
) action_stats ON p.id = action_stats.project_id
LEFT JOIN (
    SELECT 
        project_id,
        COUNT(*) as total_milestones,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_milestones
    FROM pdca_milestones
    GROUP BY project_id
) milestone_stats ON p.id = milestone_stats.project_id
LEFT JOIN LATERAL (
    SELECT overall_progress, update_date
    FROM pdca_progress_updates
    WHERE project_id = p.id
    ORDER BY update_date DESC
    LIMIT 1
) latest_update ON true;

-- Grant permissions (adjust based on your user roles)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;