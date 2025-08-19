const { Resend } = require('resend');

const resend = new Resend('re_etjbghFf_GMjLx5c2PPq36ApiCuutpEoR');

async function testEmail() {
  try {
    const result = await resend.emails.send({
      from: 'Toledo Test <contact@thefortaiagency.com>',
      to: 'aoberlin@thefortaiagency.ai',
      subject: 'Test from Toledo Platform',
      html: '<p>This is a test email from the Toledo platform bug report system.</p>',
      text: 'This is a test email from the Toledo platform bug report system.'
    });
    
    console.log('✅ Email sent successfully:', result);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}

testEmail();