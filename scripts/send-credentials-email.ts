import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Import Gmail API credentials from nexus-platform
const GMAIL_CREDENTIALS = {
  GMAIL_SERVICE_ACCOUNT: 'aimpacthelp@thefortai-gc-env.iam.gserviceaccount.com',
  GMAIL_USER_TO_IMPERSONATE: 'aoberlin@thefortaiagency.com',
  GMAIL_PRIVATE_KEY: process.env.GMAIL_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCuDV9u4XFYMGxB
ill9tuPacIqrU0sMTQ74WZYfstWxnludUcDXMhQ3HABP+Rhmjh7+8pBublX2o+BZ
iCb3KuGyDSPYjgVOftoW8A+wmK3/HBSeG/QWyjnnTLDNoUlzeR3gA3f01NFUeQ/Z
XAOkyvPL9zlo9QD9GWQ2r8oiV72dkhA/2NwgOiKAftNFoiMo2p2iy5SkRbLXyT8I
OlXAJas0Ss3FJmEwRLNz5OpGTqlOuMLzQ7zhbYKNGkmQOlPgU1B+iJab5V7i6fpf
PQnowTe8K/mxpErx5XAMBnVpE8ckg41xGLGXyFEC1uQkjIuvJZA7XbunjyI4m0kr
+VuaeqbvAgMBAAECggEADsz6UY6AOfScMBKYu5UC2T96u0jw99HRtRLBLl7hxyHl
PoKGOIZ8q5cI+8P97DKnthxgZdOiIcAbwuFOFvShjqeJZc/l6Z/l4c92Nhk1qpzz
r+JGpm158Q5XdpUBjv08qiEBYWN7jYhh7aTidm//vVd/nUpAVEWFfRUDxlnZuP1f
qRK3PXjqm79+O+Dgy3HXFgT94sSGbZ6t8AVURCJ6qxwEWHWu3hXlhURO1+orNAu3
srBx2XI4kckPatRBefAxOGr79dg2E/1Uz1insKj9aaj8VFXUWTUOMmiMiAsionYO
i9GuFx7ElTP04Q9F3stMI+BEZWngJev5XueHI6l+SQKBgQDpfaWNjvPqAPvdThR1
WoFvGpy71pUB8T+jJzsF9g8UHII18eDwolphCeyXa6E0n2mj4XcYhTnHyhCgNtLr
tdTtQHDnw9otV2VMaWGi+HpUHOiezis3YpVnYzeeUGsr2xsvVuBbVyo6YDUY6VZL
Q217ml/WVwC5e/5apdgiDCaaEwKBgQC+1NVDEyxmrc9mFEIVbBvJhpJZHPTZxtZA
BWmAgYV8+W86I+7htGuabwfkDAMTG33NylzbB1sA/1KNYSLbUWqgxLiIW4zIKLzS
fn6cNaeUoPHGCr2giPR3HRVDM68k7cevF8ZrnyjrgMCor9X5N57F4xMbBzr2x4pE
tHvO4mhbNQKBgFJzy02U6K9+z3JUC0dxwXlhlW2DljUMY2OTC/XL8YExnA2+r6dq
Pa482e6S1GeHz79OdEcVbNUPlxVspskT+fAaLIS7lcUjMqNsJ01sn44qcz75ISu6
xXWwBMkELwRaqFvsOugmfMQGi1mTtKR5WCUo26UOLjRSA/0wyYUkc1E/AoGAZPGa
eeerhgkM+3dd2Y0dScXopkDd+FDoxmbWfwaEgS5EuuGFHFlezgtLhkMgYTwamQAh
jC7g4a8tkOHAGXmAyNgmsOKUntCFyWbmPGVZZxKXseW+lyu6/UMiGzE8xXEOPr15
1TYU5DZwMwsISdM1JoJOee6iLyYwKtW55B75ir0CgYEAzZKGs56QZs7iZ9ETdzUq
1twnbt3M/cSOGyNHA7kQa2LW8H7KVfVbXtTj4q6v4w9IWyaoB50x2g3mTQyj1lA1
Nm5ymEd1qWTNbY70gaIYXDOb3I3l82utladXcgMMASRYLUIJcdwMnPm1Zxpw8lFE
Z/WzHJ5OciD352NaQdmdsPY=
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