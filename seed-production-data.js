const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zdwtgafaoevevrzrizhs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI5NTM3NywiZXhwIjoyMDcwODcxMzc3fQ.1xIBVIqH_4LOsV95hePOOaUjlI7JVdubeHCA_hXn1ZU'
);

async function seedData() {
  console.log('Seeding production data...');

  // Check if machines already exist
  const { data: existingMachines } = await supabase.from('machines').select('*').limit(5);
  
  let machineData;
  if (!existingMachines || existingMachines.length === 0) {
    // Add machines with proper schema
    const machines = [
      { 
        machine_number: '5', 
        machine_name: 'Press 5', 
        tonnage: 150,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { 
        machine_number: '7', 
        machine_name: 'Press 7', 
        tonnage: 200,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { 
        machine_number: '12', 
        machine_name: 'Press 12', 
        tonnage: 300,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { 
        machine_number: '15', 
        machine_name: 'Press 15', 
        tonnage: 250,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { 
        machine_number: '20', 
        machine_name: 'Press 20', 
        tonnage: 400,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { data: newMachineData, error: machineError } = await supabase
      .from('machines')
      .insert(machines)
      .select();

    if (machineError) {
      console.error('Error inserting machines:', machineError);
      return;
    }
    machineData = newMachineData;
    console.log('Machines inserted:', machineData.length);
  } else {
    machineData = existingMachines;
    console.log('Using existing machines:', machineData.length);
  }

  // Check if shifts already exist
  const { data: existingShifts } = await supabase.from('shifts').select('*').limit(5);
  
  let shiftData;
  if (!existingShifts || existingShifts.length === 0) {
    const shifts = [
      { 
        shift_name: 'Day Shift', 
        start_time: '06:00:00', 
        end_time: '14:00:00',
        created_at: new Date().toISOString()
      },
      { 
        shift_name: 'Afternoon Shift', 
        start_time: '14:00:00', 
        end_time: '22:00:00',
        created_at: new Date().toISOString()
      },
      { 
        shift_name: 'Night Shift', 
        start_time: '22:00:00', 
        end_time: '06:00:00',
        created_at: new Date().toISOString()
      }
    ];

    const { data: newShiftData, error: shiftError } = await supabase
      .from('shifts')
      .insert(shifts)
      .select();

    if (shiftError) {
      console.error('Error inserting shifts:', shiftError);
      return;
    }
    shiftData = newShiftData;
    console.log('Shifts inserted:', shiftData.length);
  } else {
    shiftData = existingShifts;
    console.log('Using existing shifts:', shiftData.length);
  }

  // Generate production data for last 30 days
  const productionData = [];
  const now = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // For each machine and shift combination
    for (const machine of machineData) {
      for (const shift of shiftData) {
        // Random but realistic production data
        const efficiency = 70 + Math.random() * 30; // 70-100%
        const totalCycles = Math.floor(300 + Math.random() * 200); // 300-500 cycles
        const goodParts = Math.floor(totalCycles * (efficiency / 100));
        const scrapParts = totalCycles - goodParts;
        const downtime = Math.floor(Math.random() * 120); // 0-120 minutes

        productionData.push({
          date: date.toISOString().split('T')[0],
          machine_id: machine.id,
          shift_id: shift.id,
          part_id: null,
          operator_id: null,
          total_cycles: totalCycles,
          good_parts: goodParts,
          scrap_parts: scrapParts,
          downtime_minutes: downtime,
          quoted_efficiency: 85, // Target efficiency
          actual_efficiency: parseFloat(efficiency.toFixed(1)),
          scheduled_hours: 8,
          actual_hours: 8 - (downtime / 60),
          operator_comments: null,
          supervisor_comments: null,
          manning_status: 'full',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
  }

  // Insert production data in batches
  const batchSize = 50;
  for (let i = 0; i < productionData.length; i += batchSize) {
    const batch = productionData.slice(i, i + batchSize);
    const { error: prodError } = await supabase
      .from('production_data')
      .insert(batch);

    if (prodError) {
      console.error('Error inserting production data batch:', prodError);
      return;
    }
    console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(productionData.length/batchSize)}`);
  }

  console.log('Production data seeded successfully!');
  console.log(`Total records: ${productionData.length}`);
}

seedData().catch(console.error);