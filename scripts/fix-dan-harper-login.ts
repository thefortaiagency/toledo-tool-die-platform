import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Use service role key for admin operations
const supabaseUrl = 'https://zdwtgafaoevevrzrizhs.supabase.co'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI5NTM3NywiZXhwIjoyMDcwODcxMzc3fQ.1xIBVIqH_4LOsV95hePOOaUjlI7JVdubeHCA_hXn1ZU'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function fixDanHarperLogin() {
  console.log('Checking Dan Harper user...')
  
  // First check if user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'dan.harper@toledotool.com')
    .single()
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching user:', fetchError)
    return
  }
  
  const hashedPassword = await bcrypt.hash('Harper2025!!!', 10)
  
  if (existingUser) {
    console.log('User exists, updating password...')
    
    // Update existing user
    const { data, error } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', 'dan.harper@toledotool.com')
      .select()
      .single()
    
    if (error) {
      console.error('Error updating user:', error)
    } else {
      console.log('✅ Password updated successfully for Dan Harper')
      console.log('User details:', {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role
      })
    }
  } else {
    console.log('User does not exist, creating new user...')
    
    // Create new user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: 'dan.harper@toledotool.com',
        password: hashedPassword,
        name: 'Dan Harper',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating user:', error)
    } else {
      console.log('✅ User created successfully!')
      console.log('User details:', {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role
      })
    }
  }
  
  // Verify the password works
  console.log('\nVerifying login credentials...')
  console.log('Email: dan.harper@toledotool.com')
  console.log('Password: Harper2025!!!')
  
  // Test the password
  const { data: testUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'dan.harper@toledotool.com')
    .single()
  
  if (testUser) {
    const isValid = await bcrypt.compare('Harper2025!!!', testUser.password)
    console.log('Password validation:', isValid ? '✅ VALID' : '❌ INVALID')
  }
}

fixDanHarperLogin().catch(console.error)