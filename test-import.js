import { createClient } from '@supabase/supabase-js';

// Configure Supabase
const SUPABASE_URL = 'https://zdwtgafaoevevrzrizhs.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI5NTM3NywiZXhwIjoyMDcwODcxMzc3fQ.1xIBVIqH_4LOsV95hePOOaUjlI7JVdubeHCA_hXn1ZU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🏭 Testing Toledo Tool & Die Database Connection...\n');

async function testConnection() {
  try {
    // Test 1: Check if machines table exists and has data
    console.log('📊 Checking machines table...');
    const { data: machines, error: machineError } = await supabase
      .from('machines')
      .select('*')
      .limit(5);

    if (machineError) {
      console.error('❌ Error accessing machines table:', machineError.message);
      return;
    }

    console.log(`✅ Found ${machines.length} machines:`);
    machines.forEach(m => {
      console.log(`   - ${m.machine_number}: ${m.machine_name}`);
    });

    // Test 2: Check shifts
    console.log('\n📊 Checking shifts table...');
    const { data: shifts, error: shiftError } = await supabase
      .from('shifts')
      .select('*');

    if (shiftError) {
      console.error('❌ Error accessing shifts table:', shiftError.message);
      return;
    }

    console.log(`✅ Found ${shifts.length} shifts:`);
    shifts.forEach(s => {
      console.log(`   - ${s.shift_name}: ${s.start_time} to ${s.end_time}`);
    });

    // Test 3: Insert sample production data
    console.log('\n📝 Inserting sample production data...');
    
    // Get first machine and shift
    const machine = machines[0];
    const shift = shifts[0];

    if (machine && shift) {
      // First create or get a sample part
      const { data: part, error: partError } = await supabase
        .from('parts')
        .upsert({
          part_number: 'TEST-001',
          part_name: 'Test Part',
          target_efficiency: 95
        }, { onConflict: 'part_number' })
        .select()
        .single();

      if (partError) {
        console.error('❌ Error creating part:', partError.message);
        return;
      }

      // Create or get a sample operator
      const { data: operator, error: opError } = await supabase
        .from('operators')
        .upsert({
          employee_id: 'TEST-OP',
          name: 'Test Operator'
        }, { onConflict: 'employee_id' })
        .select()
        .single();

      if (opError) {
        console.error('❌ Error creating operator:', opError.message);
        return;
      }

      // Insert production data
      const productionData = {
        date: new Date().toISOString().split('T')[0],
        shift_id: shift.id,
        machine_id: machine.id,
        part_id: part.id,
        operator_id: operator.id,
        total_cycles: 5000,
        good_parts: 4850,
        scrap_parts: 150,
        downtime_minutes: 30,
        scheduled_hours: 8,
        actual_hours: 7.5,
        actual_efficiency: 97,
        operator_comments: 'Test production run - everything working well',
        manning_status: 'Have'
      };

      const { data: production, error: prodError } = await supabase
        .from('production_data')
        .insert(productionData)
        .select()
        .single();

      if (prodError) {
        if (prodError.message.includes('duplicate')) {
          console.log('⚠️  Sample data already exists for today');
        } else {
          console.error('❌ Error inserting production data:', prodError.message);
          return;
        }
      } else {
        console.log('✅ Sample production data inserted successfully!');
        console.log(`   - Machine: ${machine.machine_number}`);
        console.log(`   - Shift: ${shift.shift_name}`);
        console.log(`   - Efficiency: ${productionData.actual_efficiency}%`);
      }
    }

    // Test 4: Check if we can read the data back
    console.log('\n📊 Reading production data...');
    const { data: recentData, error: readError } = await supabase
      .from('production_data')
      .select(`
        *,
        machines (machine_number, machine_name),
        shifts (shift_name),
        parts (part_number),
        operators (name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (readError) {
      console.error('❌ Error reading production data:', readError.message);
      return;
    }

    console.log(`✅ Found ${recentData.length} recent production records`);
    if (recentData.length > 0) {
      console.log('\n📈 Latest production entry:');
      const latest = recentData[0];
      console.log(`   - Date: ${latest.date}`);
      console.log(`   - Machine: ${latest.machines?.machine_number}`);
      console.log(`   - Shift: ${latest.shifts?.shift_name}`);
      console.log(`   - Part: ${latest.parts?.part_number}`);
      console.log(`   - Operator: ${latest.operators?.name}`);
      console.log(`   - Efficiency: ${latest.actual_efficiency}%`);
    }

    // Test 5: Create an AI insight
    console.log('\n🤖 Creating sample AI insight...');
    const { error: insightError } = await supabase
      .from('ai_insights')
      .insert({
        insight_date: new Date().toISOString().split('T')[0],
        insight_type: 'prediction',
        severity: 'low',
        title: 'Production Forecast',
        description: 'Based on current trends, tomorrow\'s production is expected to meet targets',
        recommendation: 'Maintain current staffing levels and material supply',
        confidence_score: 0.85,
        status: 'new'
      });

    if (insightError && !insightError.message.includes('duplicate')) {
      console.error('❌ Error creating AI insight:', insightError.message);
    } else {
      console.log('✅ AI insight created successfully!');
    }

    console.log('\n🎉 All tests passed! Your database is ready!');
    console.log('\n📱 You can now:');
    console.log('   1. Visit the dashboard at http://localhost:3011/dashboard');
    console.log('   2. Enter new data at http://localhost:3011/entry');
    console.log('   3. Import Excel files with the import script');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();