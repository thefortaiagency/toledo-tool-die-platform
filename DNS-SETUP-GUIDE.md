# 🏭 Toledo Tool & Die - DNS Configuration Guide

## ✅ Platform Successfully Deployed!

Your Toledo Tool & Die platform is now live on Vercel and ready for DNS configuration.

## 🌐 Current URLs

- **Vercel Production**: https://toledo-tool-die-platform.vercel.app
- **GitHub Repository**: https://github.com/thefortaiagency/toledo-tool-die-platform
- **Target Domain**: https://toledotool.thefortaiagency.ai

## 📋 DNS Configuration Steps

### Option 1: GoDaddy DNS Panel (Manual)

1. **Log into GoDaddy**
   - Go to https://dcc.godaddy.com/control/portfolio
   - Find `thefortaiagency.ai` domain

2. **Access DNS Management**
   - Click on the domain
   - Select "DNS" or "Manage DNS"

3. **Add A Record**
   - Click "Add" or "Add Record"
   - Type: `A`
   - Name: `toledotool`
   - Value: `76.76.21.21`
   - TTL: `600` (10 minutes)
   - Save the record

4. **Verify Configuration**
   - DNS propagation takes 5-30 minutes
   - Check status at: https://www.whatsmydns.net/#A/toledotool.thefortaiagency.ai

### Option 2: Using GoDaddy API (Automated)

If you have GoDaddy API credentials:

```bash
# Set your credentials
export GODADDY_API_KEY="your_api_key_here"
export GODADDY_API_SECRET="your_api_secret_here"

# Run the automated setup
node setup-toledo-dns.js
```

To get GoDaddy API credentials:
1. Go to https://developer.godaddy.com/keys
2. Create a production key
3. Save the key and secret

## 🚀 Platform Features

### Production Data
- ✅ **1,135 production records** imported from 103 Excel files
- ✅ **6 machines** configured (600, 1000, 1400, 1500-1, 1500-2, 3000 ton)
- ✅ **3 shifts** daily tracking
- ✅ **Real-time updates** via Supabase

### Dashboard Capabilities
- 📊 Live production metrics
- 📈 Efficiency analysis
- 🎯 AI-powered insights
- 📉 Trend visualization
- ⚡ Real-time data streaming

### Technology Stack
- **Frontend**: Next.js 15 + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Styling**: Tailwind CSS with Toledo branding
- **Deployment**: Vercel with GitHub CI/CD

## 🔗 Important Links

### Production Environment
- **Main App**: https://toledo-tool-die-platform.vercel.app
- **Dashboard**: https://toledo-tool-die-platform.vercel.app/dashboard
- **Data Entry**: https://toledo-tool-die-platform.vercel.app/entry

### Development
- **GitHub**: https://github.com/thefortaiagency/toledo-tool-die-platform
- **Local Dev**: http://localhost:3000

### Database
- **Supabase Dashboard**: https://supabase.com/dashboard/project/zdwtgafaoevevrzrizhs
- **Database Tables**: 10 production-ready tables

## 📱 Access Credentials

### Platform Login
- No authentication required (internal platform)
- Direct access to all features

### Environment Variables (Already Configured in Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://zdwtgafaoevevrzrizhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[configured]
```

## 🎨 Toledo Branding Applied

- **Logo**: Orange Toledo Tool & Die logo
- **Colors**: 
  - Primary: Orange (#f97316)
  - Secondary: Slate (#64748b)
  - Dark: #1e293b
- **Typography**: System UI with proper contrast
- **Theme**: Professional manufacturing aesthetic

## 📞 Support

If you need assistance:
1. Check Vercel deployment logs
2. Verify DNS propagation status
3. Test database connection in Supabase

---

**Status**: ✅ Platform is LIVE and ready for production use!

Once DNS is configured, Toledo Tool & Die will have a complete, professional production metrics platform at **toledotool.thefortaiagency.ai**