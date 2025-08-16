const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createNexusUser() {
  // Use service role key to bypass RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });

  try {
    // Create the NEXUS user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'nexus@thefortaiagency.ai',
      password: 'Nexus2025!!!',
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        full_name: 'NEXUS Admin',
        role: 'admin'
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✓ User nexus@thefortaiagency.ai already exists');
        
        // Try to update the password for existing user
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        
        if (!listError && users) {
          const existingUser = users.users.find(u => u.email === 'nexus@thefortaiagency.ai');
          if (existingUser) {
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              { password: 'Nexus2025!!!' }
            );
            
            if (updateError) {
              console.error('Could not update password:', updateError.message);
            } else {
              console.log('✓ Password updated for existing user');
            }
          }
        }
      } else {
        throw error;
      }
    } else {
      console.log('✓ Successfully created NEXUS user:');
      console.log('  Email: nexus@thefortaiagency.ai');
      console.log('  Password: Nexus2025!!!');
      console.log('  User ID:', data.user?.id);
    }

    console.log('\n✅ You can now login with:');
    console.log('   Email: nexus@thefortaiagency.ai');
    console.log('   Password: Nexus2025!!!');

  } catch (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }
}

createNexusUser();