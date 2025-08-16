const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zdwtgafaoevevrzrizhs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI5NTM3NywiZXhwIjoyMDcwODcxMzc3fQ.1xIBVIqH_4LOsV95hePOOaUjlI7JVdubeHCA_hXn1ZU'
);

async function analyzeComments() {
  const { data } = await supabase
    .from('production_data')
    .select('operator_comments, downtime_minutes, actual_efficiency')
    .not('operator_comments', 'is', null);
    
  console.log('=== REAL OPERATOR COMMENTS ANALYSIS ===');
  console.log('Total comments:', data?.length || 0);
  console.log('\n');
  
  // Analyze common themes
  const themes = {
    'Die/Tooling': [],
    'Material/Feed': [],
    'Hydraulic/Pressure': [],
    'Quality/Burrs': [],
    'Sensor/Electrical': [],
    'Setup/Changeover': [],
    'Maintenance/Repair': [],
    'Overload/Safety': [],
    'Parts/Components': []
  };
  
  // Track issues that caused significant downtime
  const downtimeIssues = [];
  
  data?.forEach(record => {
    const comment = record.operator_comments.toLowerCase();
    
    // Categorize
    if (comment.includes('die') || comment.includes('tool')) themes['Die/Tooling'].push(comment);
    if (comment.includes('material') || comment.includes('coil') || comment.includes('blank') || comment.includes('feed')) themes['Material/Feed'].push(comment);
    if (comment.includes('hydraulic') || comment.includes('pressure')) themes['Hydraulic/Pressure'].push(comment);
    if (comment.includes('burr') || comment.includes('quality') || comment.includes('split')) themes['Quality/Burrs'].push(comment);
    if (comment.includes('sensor') || comment.includes('power') || comment.includes('electrical')) themes['Sensor/Electrical'].push(comment);
    if (comment.includes('setup') || comment.includes('changeover') || comment.includes('adjust')) themes['Setup/Changeover'].push(comment);
    if (comment.includes('maint') || comment.includes('repair') || comment.includes('fix') || comment.includes('broken')) themes['Maintenance/Repair'].push(comment);
    if (comment.includes('overload') || comment.includes('safety')) themes['Overload/Safety'].push(comment);
    if (comment.includes('part') || comment.includes('fitting') || comment.includes('spring')) themes['Parts/Components'].push(comment);
    
    // Track high downtime issues
    if (record.downtime_minutes > 30) {
      downtimeIssues.push({
        comment: comment.substring(0, 80),
        downtime: record.downtime_minutes,
        efficiency: record.actual_efficiency
      });
    }
  });
  
  console.log('COMMENT THEMES BREAKDOWN:');
  console.log('=' .repeat(60));
  Object.entries(themes).forEach(([theme, comments]) => {
    if (comments.length > 0) {
      console.log(`\n${theme}: ${comments.length} occurrences (${Math.round(comments.length / data.length * 100)}%)`);
      // Show first 2 unique examples
      const unique = [...new Set(comments)];
      unique.slice(0, 2).forEach(c => {
        console.log(`  • "${c.substring(0, 70)}${c.length > 70 ? '...' : ''}"`);
      });
    }
  });
  
  console.log('\n\nHIGH DOWNTIME ISSUES (>30 minutes):');
  console.log('=' .repeat(60));
  downtimeIssues.forEach(issue => {
    console.log(`• ${issue.downtime} min downtime: "${issue.comment}..."`);
  });
  
  // Suggest new fields based on patterns
  console.log('\n\nSUGGESTED NEW FIELDS FOR DATA ENTRY:');
  console.log('=' .repeat(60));
  console.log('Based on comment analysis, consider adding:');
  console.log('\n1. ISSUE CATEGORY (dropdown):');
  console.log('   - Die/Tooling Issue');
  console.log('   - Material Feed Problem');  
  console.log('   - Hydraulic/Pressure Issue');
  console.log('   - Quality/Defect Issue');
  console.log('   - Electrical/Sensor Problem');
  console.log('   - Setup/Changeover');
  console.log('   - Maintenance Required');
  console.log('   - Machine Overload');
  console.log('   - Component Failure');
  console.log('   - Other');
  
  console.log('\n2. SEVERITY LEVEL (radio):');
  console.log('   - Critical (stopped production)');
  console.log('   - Major (slowed production)');
  console.log('   - Minor (no impact)');
  
  console.log('\n3. ACTION TAKEN (multiselect):');
  console.log('   - Adjusted settings');
  console.log('   - Called maintenance');
  console.log('   - Replaced component');
  console.log('   - Cleaned/cleared jam');
  console.log('   - Temporary fix applied');
  console.log('   - Stopped for safety');
  console.log('   - Continued with issue');
  
  console.log('\n4. ADDITIONAL TRACKING FIELDS:');
  console.log('   - Root cause (text)');
  console.log('   - Parts replaced (text)');
  console.log('   - Follow-up required (checkbox)');
  console.log('   - Safety concern (checkbox)');
}

analyzeComments().catch(console.error);