import { createClient } from '@supabase/supabase-js'

// Use service role key for admin operations
const supabaseUrl = 'https://zdwtgafaoevevrzrizhs.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI5NTM3NywiZXhwIjoyMDcwODcxMzc3fQ.1xIBVIqH_4LOsV95hePOOaUjlI7JVdubeHCA_hXn1ZU'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createDanHarperUser() {
  console.log('Creating Dan Harper user in Supabase Auth...\n')
  
  const email = 'dan.harper@toledotool.com'
  const password = 'Harper2025!!!'
  
  try {
    // First try to list users to see if the email exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return
    }
    
    const existingUser = users?.find(u => u.email === email)
    
    if (existingUser) {
      console.log('User already exists. Updating password...')
      
      // Update existing user's password
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { 
          password: password,
          email_confirm: true
        }
      )
      
      if (updateError) {
        console.error('Error updating user:', updateError)
      } else {
        console.log('✅ Password updated successfully!')
        console.log('User details:')
        console.log('  ID:', updatedUser.user?.id)
        console.log('  Email:', updatedUser.user?.email)
        console.log('  Created:', updatedUser.user?.created_at)
      }
    } else {
      console.log('Creating new user...')
      
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: 'Dan Harper',
          role: 'admin'
        }
      })
      
      if (createError) {
        console.error('Error creating user:', createError)
      } else {
        console.log('✅ User created successfully!')
        console.log('User details:')
        console.log('  ID:', newUser.user?.id)
        console.log('  Email:', newUser.user?.email)
        console.log('  Created:', newUser.user?.created_at)
      }
    }
    
    // Test the login
    console.log('\n📋 Login Credentials:')
    console.log('  Email: dan.harper@toledotool.com')
    console.log('  Password: Harper2025!!!')
    console.log('\n✅ You can now login at: http://localhost:3010/login')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createDanHarperUser().catch(console.error)