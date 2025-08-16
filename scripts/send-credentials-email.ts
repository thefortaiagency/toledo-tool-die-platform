import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Import Gmail API credentials from nexus-platform
const GMAIL_CREDENTIALS = {
  GMAIL_SERVICE_ACCOUNT: 'nexus-automation@nexus-platform-437117.iam.gserviceaccount.com',
  GMAIL_USER_TO_IMPERSONATE: 'aoberlin@thefortaiagency.com',
  GMAIL_PRIVATE_KEY: process.env.GMAIL_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCo7kJRkKHzRiA4
x96LQmLx/0HYedJ/cDxA3+aOaJRLZ7Iw2o3EJRiXJjg4P5G4xoSJF3Z4o2BvDdl9
N7pS3UJlABaU5B6KcJTKhrvfIWlGQWjGBnNzrbsEeJxODlJmLRgFd0bMVx2I3S7B
g0oPxQoOEHFg3vD6xIKy9pGOoRCfHQHcEBOdoVQOW5jCGP7MJhPUCqj5VqHTtjsz
e8xXNSiLlzE4k9k3HUPJxw/1Pq5yAzCN+AEXb3yDJqhAC/VLxhqFqIFg4wR6FGT9
yf3vCxOJk6AXcxwz8Wk2VQ5PSAPj8+9pQRv+0LCJyQUFGAA0PDJOyU3wdXYdRKR5
5pGqhtQ3AgMBAAECggEAHC7tJMZRhKgAKCy8ifMHMCQMEQCy8qd/Fh4HCNs2BqST
oP1pZmMzlMCo5C5UhqA0gCOFo+FQCWj3w1spF/RMxdGxrEHH8eEiOGvKxcJN3Nxu
Kc/Q11WqrQNINfwgLhVLCPbpCyOZJfNI6DRFobhZu2xSQlVzCKRAb1y3sA6L7LKF
QyqJrMhJx6I5eTLTUa1F8nQkkQ7mFRRxKzPx2/VhZvNKCL8dzLnRw0q8KvUy6nZt
KrLfYm6YCGe+sC3O7LPE0VqLU+hKxb1OeJGEu8eQlBOqTwOo/Ggl49eVBFN0n6/k
DdH4Pu1UwRAcuvjyLCdXGvLJzqawMGb8tAnzTzJQSQKBgQDgbvXaRUxYdQQupFCK
Tl0wK5L3IWVBVzm5t++YCm1cAmuF0k7LnUf7YKqRMcaBQxOb9SRSg8vR5F3WnX8J
W4m+tQ0TZDa7kOEQV6JV6T5WTCNRXnBJQSVkQRQd8p5OxvnLdpx/J4YUW+7NQnQ8
KFX5w/MvYjJj/iAEu2SrCdQ/hQKBgQDAkyT5o5L3fhJNJNRiQ72kOtJTMuRw5Kqv
U4Z9RTNqvE1SaE7m9F0MZKNd3zOKRJZMmpv8z8s3+jdqfAkMUvJEG9m8s7Y9eO1Y
Tn8zBJkS0zy6kEFuNl8l5t4x6CAd5iJD+wm9DJzfLFiYfbiCRVAF9SqFPKXOLaWF
k3xUtWdOGwKBgEy8MoBN0Qvby9lRaHOOWxfpVJT0tW8L9/JDBKGiP7INzQbE6G9p
FzYiEWA9hzoKH7CQrb7ZGkANGO8hRXa4yV8D7hnCvxgNRxPYg1xdtPFzFGHQDOFv
h8mL5U6VUkqHSqxrNUSKPBW7TnHXaNEBzqzEIRwlRQH6fSNj9r8NVCJJAoGAOTRe
hIHNdBb1a0nGOp3Vt9vp6KEbhiHe/upvKoEMKCJZIzaWJVKnGmOh3W8Ub2MV+kk8
G3D9C9pjQYvJxD8jT2MHN9TZD3V0s+cKwCCcqQUIy5fBDBwFhFXB7e3J1BQAzPRz
fP0rlOo2VJu8x6l0ixyD55OjI9pfBvOH3PqPAk0CgYEAwU1xQJjKEjRoMvUz7wXR
8vEqIEvqNx4wH7SUJ8Gx3jCGzEd1Gyx6OhMJfFNNSMX5FeKY/Eu9DHYXNmGBBPBQ
zBdUoFNm3Y9SltGQ7v7s4/gojCZIxH0ovLkSfAL5fEJ5+EczPRtshcF5C3P5ODlq
JRmGQ8mz1ZRgU3eqtR5HKmo=
-----END PRIVATE KEY-----`
}

async function sendCredentialsEmail() {
  const { google } = await import('googleapis')
  const auth = new google.auth.JWT({
    email: GMAIL_CREDENTIALS.GMAIL_SERVICE_ACCOUNT,
    key: GMAIL_CREDENTIALS.GMAIL_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    subject: GMAIL_CREDENTIALS.GMAIL_USER_TO_IMPERSONATE
  })

  const gmail = google.gmail({ version: 'v1', auth })

  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9; }
    .header { background: #1e293b; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; margin: -20px -20px 20px; }
    .logo { font-size: 24px; font-weight: bold; }
    .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .user-block { margin-bottom: 20px; padding: 15px; background: #f0f0f0; border-left: 4px solid #ff6600; }
    .label { font-weight: bold; color: #555; }
    .value { font-family: 'Courier New', monospace; color: #000; background: #fff; padding: 5px; border: 1px solid #ddd; display: inline-block; margin: 5px 0; }
    .security-note { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🏭 Toledo Tool & Die</div>
      <p style="margin: 10px 0 0;">Production Platform Authentication</p>
    </div>

    <h2>Platform Authentication Setup Complete</h2>
    
    <p>Coach, the Toledo Tool & Die platform is now secured with Supabase authentication. Here are the login credentials for the authorized users:</p>

    <div class="credentials">
      <div class="user-block">
        <h3>👤 Administrator Account</h3>
        <p><span class="label">Name:</span> <span class="value">Adam Oberlin</span></p>
        <p><span class="label">Email:</span> <span class="value">aoberlin@thefortaiagency.com</span></p>
        <p><span class="label">Password:</span> <span class="value">Oberlin4108!!!</span></p>
        <p><span class="label">Role:</span> <span class="value">admin</span></p>
      </div>

      <div class="user-block">
        <h3>👤 Manager Account</h3>
        <p><span class="label">Name:</span> <span class="value">Dan Harper</span></p>
        <p><span class="label">Email:</span> <span class="value">dan.harper@toledotool.com</span></p>
        <p><span class="label">Password:</span> <span class="value">Harper2025!!!</span></p>
        <p><span class="label">Role:</span> <span class="value">manager</span></p>
      </div>
    </div>

    <div class="security-note">
      <h4>🔐 Security Features Implemented:</h4>
      <ul>
        <li>✅ Supabase authentication with secure sessions</li>
        <li>✅ Protected routes requiring login</li>
        <li>✅ Automatic logout functionality</li>
        <li>✅ Session persistence across page refreshes</li>
        <li>✅ User email display in navigation bar</li>
        <li>✅ Redirect to login for unauthorized access</li>
      </ul>
    </div>

    <h3>Access the Platform:</h3>
    <p>Users can now log in at: <a href="http://localhost:3000/login">http://localhost:3000/login</a></p>
    <p>After deployment: <a href="https://toledo.thefortaiagency.com/login">https://toledo.thefortaiagency.com/login</a></p>

    <div class="footer">
      <p>Generated by NEXUS Platform • ${new Date().toLocaleString()}</p>
      <p>Powered by AImpact Nexus Orchestrator</p>
    </div>
  </div>
</body>
</html>
  `

  const message = [
    'To: aoberlin@thefortaiagency.com',
    'Subject: 🔐 Toledo Tool & Die Platform - Authentication Setup Complete',
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    emailContent
  ].join('\n')

  const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_')

  try {
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    })

    console.log('✅ Email sent successfully!')
    console.log('Message ID:', result.data.id)
  } catch (error) {
    console.error('Error sending email:', error)
  }
}

sendCredentialsEmail().catch(console.error)