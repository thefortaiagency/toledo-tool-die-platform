import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!')
  console.error('URL:', supabaseUrl)
  console.error('Service Key:', supabaseServiceKey ? '***hidden***' : 'missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createUsers() {
  const users = [
    {
      email: 'aoberlin@thefortaiagency.com',
      password: 'Oberlin4108!!!',
      name: 'Adam Oberlin',
      role: 'admin'
    },
    {
      email: 'dan.harper@toledotool.com',
      password: 'Harper2025!!!',
      name: 'Dan Harper',
      role: 'manager'
    }
  ]

  console.log('Creating users in Supabase...')

  for (const user of users) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: user.name,
          role: user.role
        }
      })

      if (authError) {
        console.error(`Error creating user ${user.email}:`, authError.message)
        continue
      }

      console.log(`✓ Created user: ${user.email}`)

      // Create operator record for the user
      const { error: opError } = await supabase
        .from('operators')
        .insert({
          employee_id: `USR-${Date.now()}`,
          name: user.name,
          email: user.email
        })

      if (opError) {
        console.error(`Error creating operator record for ${user.email}:`, opError.message)
      } else {
        console.log(`✓ Created operator record for: ${user.name}`)
      }

    } catch (error) {
      console.error(`Unexpected error for ${user.email}:`, error)
    }
  }

  console.log('\nUser creation complete!')
  console.log('\nLogin credentials:')
  console.log('==================')
  users.forEach(user => {
    console.log(`\nEmail: ${user.email}`)
    console.log(`Password: ${user.password}`)
    console.log(`Name: ${user.name}`)
    console.log(`Role: ${user.role}`)
  })
}

createUsers().catch(console.error)