import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdwtgafaoevevrzrizhs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkd3RnYWZhb2V2ZXZyenJpemhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTUzNzcsImV4cCI6MjA3MDg3MTM3N30.i6axuHvUs5RRC8vybo7qRMUt68st1nLBQM7VRuyqO48'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  console.log('Testing Dan Harper login...\n')
  
  const email = 'dan.harper@toledotool.com'
  const password = 'Harper2025!!!'
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('❌ Login failed:', error.message)
      return
    }
    
    if (data?.session) {
      console.log('✅ Login successful!')
      console.log('\nSession details:')
      console.log('  User ID:', data.user?.id)
      console.log('  Email:', data.user?.email)
      console.log('  Access Token:', data.session.access_token.substring(0, 20) + '...')
      console.log('  Expires:', new Date(data.session.expires_at! * 1000).toLocaleString())
      console.log('\n📋 You can now login at: http://localhost:3010/login')
      console.log('  Email: dan.harper@toledotool.com')
      console.log('  Password: Harper2025!!!')
    } else {
      console.error('❌ No session returned')
    }
    
    // Sign out after test
    await supabase.auth.signOut()
    console.log('\n✅ Test complete - signed out')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testLogin().catch(console.error)