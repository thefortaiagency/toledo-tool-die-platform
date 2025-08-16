#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zdwtgafaoevevrzrizhs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI5NTM3NywiZXhwIjoyMDcwODcxMzc3fQ.1xIBVIqH_4LOsV95hePOOaUjlI7JVdubeHCA_hXn1ZU'
);

// Sample realistic comments for production issues
const sampleComments = {
  operator: [
    "Die alignment issue on station 2, adjusted and running better now",
    "Material feed problem, coil tangled. Lost 15 minutes",
    "4 out die showing wear, needs maintenance review",
    "Setup took longer than expected due to tooling change",
    "Machine running slow, hydraulic pressure seems low",
    "Quality issue with part finish, adjusted die clearance",
    "Changeover from part A to part B completed",
    "Scrap rate higher than normal, checking die condition",
    "Good run today, no issues to report",
    "Die needs sharpening, getting burrs on parts",
    "Material thickness variation causing feed issues",
    "Press cycling slow, maintenance notified",
    "Part sticking in die, applied more lubricant",
    "Sensor malfunction on feed system, manual mode for now",
    "Die spring broken, temporary fix applied"
  ],
  supervisor: [
    "Schedule maintenance for die repair next shift",
    "Operator training needed on new setup procedure",
    "Good efficiency this shift, keep it up",
    "Need to order replacement die components",
    "Quality audit passed, no defects found",
    "Review changeover process, taking too long",
    "Machine needs full maintenance check this weekend",
    "Excellent teamwork during breakdown recovery",
    "Consider die modification to reduce scrap",
    "Material supplier issue causing variations"
  ]
};

async function addSampleComments() {
  console.log('📝 Adding sample comments to production_data...\n');
  
  try {
    // Get recent production records without comments
    const { data: records, error } = await supabase
      .from('production_data')
      .select('id, date, machine_id, actual_efficiency')
      .is('operator_comments', null)
      .order('date', { ascending: false })
      .limit(30);
    
    if (error) throw error;
    
    if (!records || records.length === 0) {
      console.log('No records without comments found');
      return;
    }
    
    console.log(`Found ${records.length} records to update\n`);
    
    let updatedCount = 0;
    
    for (const record of records) {
      // Randomly decide what type of comments to add
      const hasOperatorComment = Math.random() > 0.3; // 70% chance
      const hasSupervisorComment = Math.random() > 0.7; // 30% chance
      
      if (!hasOperatorComment && !hasSupervisorComment) continue;
      
      const updates = {};
      
      // Add operator comment based on efficiency
      if (hasOperatorComment) {
        const efficiency = record.actual_efficiency || 85;
        let commentPool = sampleComments.operator;
        
        // Select comments based on efficiency
        if (efficiency < 70) {
          // Low efficiency - use problem-related comments
          commentPool = sampleComments.operator.filter((c, i) => 
            c.includes('issue') || c.includes('problem') || c.includes('slow') || i < 8
          );
        } else if (efficiency > 95) {
          // High efficiency - use positive comments
          commentPool = sampleComments.operator.filter(c => 
            c.includes('Good') || c.includes('no issues') || !c.includes('problem')
          );
        }
        
        updates.operator_comments = commentPool[Math.floor(Math.random() * commentPool.length)];
      }
      
      // Add supervisor comment
      if (hasSupervisorComment) {
        updates.supervisor_comments = sampleComments.supervisor[
          Math.floor(Math.random() * sampleComments.supervisor.length)
        ];
      }
      
      // Update the record
      const { error: updateError } = await supabase
        .from('production_data')
        .update(updates)
        .eq('id', record.id);
      
      if (updateError) {
        console.error(`Failed to update record ${record.id}:`, updateError);
      } else {
        updatedCount++;
        console.log(`✓ Updated record from ${record.date}${updates.operator_comments ? ' (operator)' : ''}${updates.supervisor_comments ? ' (supervisor)' : ''}`);
      }
    }
    
    console.log(`\n✅ Successfully added comments to ${updatedCount} records`);
    console.log('\n📊 You can now view the comments at /reports/comments');
    
  } catch (error) {
    console.error('❌ Error adding sample comments:', error);
  }
}

// Run the script
addSampleComments();