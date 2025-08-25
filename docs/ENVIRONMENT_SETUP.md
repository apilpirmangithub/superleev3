# 🚀 Superlee AI Agent - Environment Setup Guide

Complete guide for setting up environment variables for production and development.

## 📋 Quick Setup Checklist

### ✅ **REQUIRED (Must Have)**
- [ ] `PINATA_JWT` - IPFS storage (get from pinata.cloud)
- [ ] `PINATA_GATEWAY` - IPFS gateway URL
- [ ] `NEXTAUTH_SECRET` - Security key (32+ characters)

### 🎯 **RECOMMENDED (High Priority)**  
- [ ] `SIGHTENGINE_API_USER` - AI detection user ID
- [ ] `SIGHTENGINE_API_SECRET` - AI detection secret
- [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - Wallet connectivity

### ⚙️ **OPTIONAL (Nice to Have)**
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Analytics
- [ ] `SENTRY_DSN` - Error monitoring
- [ ] Alternative AI services (Hive, OpenAI, etc.)

---

## 🔧 Step-by-Step Setup

### 1. **PINATA (IPFS Storage) - REQUIRED**

**Get Credentials:**
1. Go to [pinata.cloud](https://pinata.cloud/)
2. Create account (free tier available)
3. Dashboard → API Keys → Create Key
4. Select "Admin" permissions
5. Copy the JWT token

**Add to Environment:**
```bash
PINATA_JWT=eyJhbGciOiJIUzI1NiIs... # Your actual JWT
PINATA_GATEWAY=gateway.pinata.cloud   # Or ipfs.io
```

### 2. **SightEngine (AI Detection) - RECOMMENDED**

**Get Credentials:**
1. Go to [sightengine.com](https://sightengine.com/)
2. Create account (500 free calls/month)
3. Settings → API Keys
4. Copy API User (numeric) and API Secret

**Add to Environment:**
```bash
SIGHTENGINE_API_USER=123456789
SIGHTENGINE_API_SECRET=abc123def456...
```

### 3. **NextAuth Security - REQUIRED**

**Generate Secret:**
```bash
# Generate random 32+ character string
openssl rand -base64 32
```

**Add to Environment:**
```bash
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=https://your-domain.com
```

### 4. **WalletConnect - RECOMMENDED**

**Get Project ID:**
1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com/)
2. Create project
3. Copy Project ID

**Add to Environment:**
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123def456...
```

---

## 🏭 Production Deployment

### **Using Vercel:**
```bash
# Set environment variables in Vercel dashboard
vercel env add PINATA_JWT
vercel env add SIGHTENGINE_API_USER
vercel env add SIGHTENGINE_API_SECRET
vercel env add NEXTAUTH_SECRET
```

### **Using Fly.io:**
```bash
# Set secrets using fly CLI
fly secrets set PINATA_JWT="your-jwt-here"
fly secrets set SIGHTENGINE_API_USER="123456789"
fly secrets set SIGHTENGINE_API_SECRET="your-secret"
fly secrets set NEXTAUTH_SECRET="your-secret"
```

### **Using Docker:**
```bash
# Use environment file
docker run --env-file .env.production your-app

# Or set individual variables
docker run -e PINATA_JWT="your-jwt" -e SIGHTENGINE_API_USER="123456789" your-app
```

---

## 🧪 Testing Your Setup

### **1. Test PINATA Connection:**
```bash
curl -H "Authorization: Bearer $PINATA_JWT" \
  https://api.pinata.cloud/data/testAuthentication
```

**Expected Response:**
```json
{"message": "Congratulations! You are communicating with the Pinata API!"}
```

### **2. Test SightEngine Connection:**
```bash
curl -X POST https://api.sightengine.com/1.0/check.json \
  -F "media=@test-image.jpg" \
  -F "models=genai" \
  -F "api_user=$SIGHTENGINE_API_USER" \
  -F "api_secret=$SIGHTENGINE_API_SECRET"
```

### **3. Test Application:**
1. Start development server: `npm run dev`
2. Open browser: `http://localhost:3000`
3. Try uploading an image in IP Gatekeeper
4. Check AI detection works (should show "sightengine" source)
5. Try registering an IP asset

---

## 🔒 Security Best Practices

### **Environment File Security:**
```bash
# Never commit .env to git
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# Use different secrets for different environments
# .env.development (local)
# .env.staging (staging)
# .env.production (production)
```

### **Secret Rotation:**
- Rotate `NEXTAUTH_SECRET` every 90 days
- Rotate API keys quarterly
- Monitor API usage for unauthorized access
- Use environment-specific secrets

### **Access Control:**
- Limit PINATA API key permissions
- Use read-only keys when possible
- Monitor API quotas and usage
- Set up alerts for unusual activity

---

## 🐛 Troubleshooting

### **Common Issues:**

**❌ "PINATA_JWT not configured"**
```bash
# Check if variable is set
echo $PINATA_JWT
# Should output your JWT token

# If empty, add to .env.local and restart server
```

**❌ "SightEngine API credentials not configured"**
```bash
# Check both variables are set
echo $SIGHTENGINE_API_USER
echo $SIGHTENGINE_API_SECRET

# Both should output your credentials
```

**❌ "Unauthorized" errors**
- Check API keys are correct
- Verify account is active
- Check API quotas not exceeded

**❌ AI detection falls back to simulation**
- Normal when SightEngine not configured
- Check console logs for specific errors
- Verify SightEngine credentials

### **Debug Mode:**
```bash
# Enable verbose logging
DEBUG_MODE=true
VERBOSE_LOGGING=true
LOG_LEVEL=debug
```

---

## 💰 Cost Optimization

### **Free Tiers:**
- **Pinata**: 1GB free storage
- **SightEngine**: 500 API calls/month
- **Vercel**: Hobby plan free tier
- **WalletConnect**: Free for < 1M requests

### **Usage Monitoring:**
```bash
# Monitor API usage
# Check Pinata dashboard for storage usage
# Check SightEngine dashboard for API calls
# Set up billing alerts
```

### **Optimization Tips:**
- Use image compression to reduce IPFS storage costs
- Cache AI detection results to reduce API calls
- Use CDN for static assets
- Optimize image sizes before upload

---

## 📚 Additional Resources

- [Pinata Documentation](https://docs.pinata.cloud/)
- [SightEngine API Docs](https://sightengine.com/docs/)
- [Story Protocol Docs](https://docs.story.foundation/)
- [WalletConnect Docs](https://docs.walletconnect.com/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## 🆘 Getting Help

**If you're stuck:**
1. Check this documentation first
2. Look at console logs for error messages
3. Verify all required environment variables are set
4. Test individual services (PINATA, SightEngine) separately
5. Check service status pages for outages

**Need support?**
- Create issue in repository
- Check existing discussions
- Contact service providers for API-specific issues

---

**🎯 Minimum viable setup:** Just `PINATA_JWT` and `NEXTAUTH_SECRET` will get you running!
