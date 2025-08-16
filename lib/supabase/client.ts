import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 2
    },
    reconnectAfterMs: (retries: number) => {
      // Exponential backoff: 1s, 2s, 4s, 8s, then stop trying
      if (retries > 4) return -1
      return Math.min(1000 * Math.pow(2, retries), 8000)
    }
  }
})

// Database types
export type Machine = {
  id: string
  machine_number: string
  machine_name: string | null
  tonnage: number | null
  status: string
  created_at: string
  updated_at: string
}

export type ProductionData = {
  id: string
  date: string
  shift_id: string
  machine_id: string
  part_id: string | null
  operator_id: string | null
  total_cycles: number
  good_parts: number
  scrap_parts: number
  downtime_minutes: number
  quoted_efficiency: number | null
  actual_efficiency: number | null
  scheduled_hours: number | null
  actual_hours: number | null
  operator_comments: string | null
  supervisor_comments: string | null
  manning_status: string | null
  created_at: string
  updated_at: string
}

export type Shift = {
  id: string
  shift_name: string
  start_time: string
  end_time: string
  created_at: string
}

export type Part = {
  id: string
  part_number: string
  part_name: string | null
  customer: string | null
  target_efficiency: number | null
  cycle_time: number | null
  created_at: string
  updated_at: string
}

export type Operator = {
  id: string
  employee_id: string
  name: string
  shift: string | null
  status: string
  created_at: string
  updated_at: string
}

export type AIInsight = {
  id: string
  insight_date: string
  insight_type: 'anomaly' | 'prediction' | 'recommendation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  machine_id: string | null
  part_id: string | null
  operator_id: string | null
  title: string
  description: string
  recommendation: string | null
  confidence_score: number
  status: 'new' | 'reviewed' | 'acted_upon' | 'dismissed'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}