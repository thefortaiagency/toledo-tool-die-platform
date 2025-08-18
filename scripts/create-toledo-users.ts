import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface UserToCreate {
  email: string
  password: string
  name: string
}

const users: UserToCreate[] = [
  {
    email: 'adam.kujawa@toledotool.com',
    password: 'TolTool2025!!!',
    name: 'Adam Kujawa'
  },
  {
    email: 'peppi.rotella@toledotool.com',
    password: 'TolTool2025!!!',
    name: 'Peppi Rotella'
  }
]

async function createOrUpdateUser(userData: UserToCreate) {
  console.log(`\n🔍 Processing user: ${userData.email}`)
  
  try {
    // Check if user exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error(`❌ Error listing users:`, listError)
      return false
    }
    
    const existingUser = existingUsers?.users?.find(u => u.email === userData.email)
    
    if (existingUser) {
      console.log(`📝 User exists, updating password...`)
      
      // Update existing user's password
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { 
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            name: userData.name,
            company: 'Toledo Tool & Die'
          }
        }
      )
      
      if (updateError) {
        console.error(`❌ Error updating user:`, updateError)
        return false
      }
      
      console.log(`✅ Successfully updated: ${userData.email}`)
      return true
    } else {
      console.log(`➕ Creating new user...`)
      
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          company: 'Toledo Tool & Die'
        }
      })
      
      if (createError) {
        console.error(`❌ Error creating user:`, createError)
        return false
      }
      
      console.log(`✅ Successfully created: ${userData.email}`)
      console.log(`   ID: ${newUser.user?.id}`)
      return true
    }
  } catch (error) {
    console.error(`❌ Unexpected error:`, error)
    return false
  }
}

async function main() {
  console.log('🚀 Toledo Tool & Die User Creation Script')
  console.log('==========================================')
  console.log(`📍 Supabase URL: ${supabaseUrl}`)
  console.log(`🔐 Password: TolTool2025!!!`)
  console.log('')
  
  let successCount = 0
  
  for (const user of users) {
    const success = await createOrUpdateUser(user)
    if (success) successCount++
  }
  
  console.log('\n==========================================')
  console.log(`✅ Successfully processed ${successCount}/${users.length} users`)
  console.log('\n📋 Login Credentials:')
  console.log('--------------------')
  for (const user of users) {
    console.log(`${user.name}:`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Password: TolTool2025!!!`)
    console.log('')
  }
  console.log('🔗 Login at: https://toledo-tool-die-platform.vercel.app/login')
}

main().catch(console.error)