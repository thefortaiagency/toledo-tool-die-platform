import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, title, description, priority, userEmail, currentUrl, browserInfo } = body;

    // Validate required fields
    if (!type || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format priority text
    const priorityText = {
      'critical': '🔴 Critical',
      'high': '🟡 High',
      'medium': '🔵 Medium',
      'low': '🟢 Low'
    }[priority] || 'Medium';

    // Format type text
    const typeText = {
      'bug': '🐛 Bug Report',
      'feature': '💡 Feature Request',
      'improvement': '🔧 Improvement',
      'other': '📝 Other'
    }[type] || 'Other';

    // Log submission
    console.log('=== NEW TOLEDO PLATFORM TICKET ===');
    console.log(JSON.stringify({
      type: typeText,
      title,
      description,
      priority: priorityText,
      userEmail,
      currentUrl,
      browserInfo,
      timestamp: new Date().toISOString()
    }, null, 2));
    console.log('==================================\n');

    // Check for Gmail credentials
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('Gmail credentials not configured');
      return NextResponse.json({ 
        success: true, 
        message: 'Thank you for your report. We\'ll investigate and get back to you soon!',
        method: 'logged-only'
      });
    }

    try {
      // Import nodemailer
      const nodemailer = require('nodemailer');
      
      // Create transporter
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });

      // Generate ticket ID
      const ticketId = `TOL-${Date.now().toString().slice(-6)}`;

      // Email content
      const emailContent = {
        from: `"Toledo Tool & Die Platform" <${process.env.GMAIL_USER}>`,
        to: 'aoberlin@thefortaiagency.ai',
        replyTo: userEmail || process.env.GMAIL_USER,
        subject: `${typeText} [${ticketId}] - ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e293b, #334155); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Toledo Platform - New Ticket</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Ticket ID: ${ticketId}</p>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h2 style="margin: 0 0 15px 0; color: #1e293b; display: flex; align-items: center; gap: 10px;">
                  <span style="background: ${type === 'bug' ? '#ef4444' : type === 'feature' ? '#3b82f6' : '#6366f1'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${typeText}</span>
                  <span style="background: ${priority === 'critical' ? '#ef4444' : priority === 'high' ? '#f59e0b' : priority === 'medium' ? '#3b82f6' : '#10b981'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${priorityText}</span>
                </h2>
                <h3 style="color: #1e293b; margin: 0 0 15px 0;">${title}</h3>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h4 style="margin: 0 0 10px 0; color: #374151;">Description:</h4>
                <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                  <p style="white-space: pre-wrap; margin: 0; line-height: 1.6;">${description}</p>
                </div>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h4 style="margin: 0 0 15px 0; color: #374151;">Technical Details:</h4>
                <div style="font-family: 'Courier New', monospace; font-size: 12px; background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 6px;">
                  <p style="margin: 0 0 5px 0;"><strong>User Email:</strong> ${userEmail || 'Not provided'}</p>
                  <p style="margin: 0 0 5px 0;"><strong>Current URL:</strong> ${currentUrl || 'Not provided'}</p>
                  <p style="margin: 0 0 5px 0;"><strong>Browser:</strong> ${browserInfo || 'Not provided'}</p>
                  <p style="margin: 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
              <p style="margin: 0;">Generated by Toledo Tool & Die Platform</p>
            </div>
          </div>
        `,
        text: `${typeText} - ${title}\n\nTicket ID: ${ticketId}\nPriority: ${priorityText}\n\nDescription:\n${description}\n\nTechnical Details:\nUser Email: ${userEmail || 'Not provided'}\nCurrent URL: ${currentUrl || 'Not provided'}\nBrowser: ${browserInfo || 'Not provided'}\nTimestamp: ${new Date().toLocaleString()}`
      };

      // Send email
      await transporter.sendMail(emailContent);
      
      console.log('✅ Bug report email sent successfully via Gmail');
      
      return NextResponse.json({ 
        success: true, 
        message: `Thank you for your ${type === 'bug' ? 'bug report' : 'feature request'}! We've created ticket ${ticketId} and will investigate soon.`,
        ticketId,
        method: 'gmail'
      });
      
    } catch (emailError: any) {
      console.error('Gmail send failed:', emailError.message);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Your report has been logged. We\'ll investigate and get back to you soon!',
        method: 'logged-only'
      });
    }
    
  } catch (error: any) {
    console.error('Bug report API error:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}