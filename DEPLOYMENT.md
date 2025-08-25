# 🚀 Deployment Guide - Superlee AI Agent

This guide will help you deploy the Superlee AI Agent dApp to production environments with proper configuration.

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] WalletConnect Cloud project ID
- [ ] Pinata account with JWT token
- [ ] Story Protocol network configuration
- [ ] All required contract addresses for your target network

## 🔧 Required Environment Variables

### Critical Variables (Must Be Set)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_WC_PROJECT_ID` | ✅ **YES** | WalletConnect project ID from cloud.walletconnect.com |
| `PINATA_JWT` | ✅ **YES** | Pinata JWT token for IPFS uploads (keep secret) |
| `NEXT_PUBLIC_STORY_CHAIN_ID` | ✅ **YES** | Story chain ID (1315 testnet, 1514 mainnet) |
| `NEXT_PUBLIC_STORY_RPC` | ✅ **YES** | Story RPC endpoint |

### Optional But Recommended

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SPG_COLLECTION` | Your SPG collection contract address |
| `NEXT_PUBLIC_TOKEN_USDC` | USDC token address for symbol resolution |
| `NEXT_PUBLIC_TOKEN_WETH` | WETH token address for symbol resolution |
| `NEXT_PUBLIC_PIPERX_AGGREGATOR` | PiperX aggregator contract |
| `PINATA_GATEWAY` | Custom Pinata gateway URL |

## 🌐 Platform-Specific Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Push your code to GitHub/GitLab
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Configure environment variables:

3. **Set Environment Variables in Vercel**
   
   Go to Project Settings → Environment Variables and add:

   ```bash
   # Required variables
   NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
   PINATA_JWT=your_pinata_jwt_token_here
   NEXT_PUBLIC_STORY_CHAIN_ID=1315
   NEXT_PUBLIC_STORY_RPC=https://aeneid.storyrpc.io
   
   # Optional variables
   NEXT_PUBLIC_SPG_COLLECTION=0xYourCollectionAddress
   NEXT_PUBLIC_TOKEN_USDC=0xYourUSDCAddress
   NEXT_PUBLIC_TOKEN_WETH=0xYourWETHAddress
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

### Netlify

1. **Build Settings**
   ```bash
   # Build command
   npm run build
   
   # Publish directory
   out
   ```

2. **Configure next.config.mjs for Static Export**
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     images: {
       unoptimized: true
     }
   };
   
   export default nextConfig;
   ```

3. **Set Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add all required environment variables

### Other Platforms (Railway, Render, etc.)

1. **Docker Deployment** (if needed)
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Environment Variables**
   - Set all required environment variables in your platform's dashboard
   - Ensure `PINATA_JWT` is marked as secret/sensitive

## 🔑 Getting Required Credentials

### 1. WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create an account or log in
3. Create a new project
4. Copy the Project ID
5. Set as `NEXT_PUBLIC_WC_PROJECT_ID`

### 2. Pinata JWT Token

1. Go to [Pinata](https://app.pinata.cloud)
2. Create an account or log in
3. Go to API Keys
4. Create a new API key with:
   - `pinFileToIPFS` permission
   - `pinJSONToIPFS` permission
5. Copy the JWT token
6. Set as `PINATA_JWT` (keep this secret!)

### 3. Story Protocol Configuration

**For Testnet (Aeneid):**
```bash
NEXT_PUBLIC_STORY_CHAIN_ID=1315
NEXT_PUBLIC_STORY_RPC=https://aeneid.storyrpc.io
```

**For Mainnet:**
```bash
NEXT_PUBLIC_STORY_CHAIN_ID=1514
NEXT_PUBLIC_STORY_RPC=https://story-rpc.blockpi.network/v1/rpc/public
```

## 🧪 Testing Your Deployment

### Pre-Production Testing

1. **Test Wallet Connection**
   - Connect different wallet types (MetaMask, WalletConnect)
   - Verify network switching works

2. **Test Swap Functionality**
   - Try small token swaps
   - Verify slippage settings work
   - Check transaction confirmation

3. **Test IP Registration**
   - Upload a test image
   - Verify IPFS upload works
   - Check Story Protocol registration

### Production Smoke Test

```bash
# Test environment variables are loaded
curl https://your-app.vercel.app/api/health

# Test IPFS upload endpoint
curl -X POST https://your-app.vercel.app/api/ipfs/json \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 🛡️ Security Best Practices

### Environment Variables Security

- ✅ **Never commit secrets to git**
- ✅ Use `.env.local` for local development
- ✅ Set `PINATA_JWT` as secret environment variable
- ✅ Rotate API keys periodically
- ✅ Use different keys for staging/production

### Production Hardening

1. **Enable Strict Transport Security**
   ```javascript
   // In next.config.mjs
   const nextConfig = {
     async headers() {
       return [
         {
           source: '/(.*)',
           headers: [
             {
               key: 'Strict-Transport-Security',
               value: 'max-age=31536000; includeSubDomains'
             }
           ]
         }
       ];
     }
   };
   ```

2. **Content Security Policy**
   ```javascript
   {
     key: 'Content-Security-Policy',
     value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
   }
   ```

## 🚨 Common Deployment Issues

### Issue: WalletConnect 400 Error
**Cause:** Using "demo" project ID or invalid project ID
**Solution:** Set proper `NEXT_PUBLIC_WC_PROJECT_ID`

### Issue: IPFS Upload Fails
**Cause:** Missing or invalid `PINATA_JWT`
**Solution:** Verify Pinata JWT token and permissions

### Issue: Wallet Connection Fails
**Cause:** Wrong chain configuration
**Solution:** Verify `NEXT_PUBLIC_STORY_CHAIN_ID` and RPC URL

### Issue: Token Symbols Not Recognized
**Cause:** Missing token address environment variables
**Solution:** Set `NEXT_PUBLIC_TOKEN_*` variables or use full addresses

## 📊 Monitoring and Maintenance

### Health Checks

Create a health check endpoint:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = {
    walletConnect: !!process.env.NEXT_PUBLIC_WC_PROJECT_ID,
    pinata: !!process.env.PINATA_JWT,
    storyRpc: !!process.env.NEXT_PUBLIC_STORY_RPC,
  };
  
  const healthy = Object.values(checks).every(Boolean);
  
  return Response.json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  }, {
    status: healthy ? 200 : 500
  });
}
```

### Analytics and Monitoring

Consider integrating:
- **Sentry** for error tracking
- **Vercel Analytics** for usage metrics
- **Custom events** for swap/registration tracking

## 🔄 Updates and Maintenance

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Test thoroughly before deploying
npm run build
npm run start
```

### Contract Address Updates

When updating contract addresses:
1. Update environment variables
2. Test on staging first
3. Verify ABI compatibility
4. Update documentation

---

## 🆘 Need Help?

If you encounter issues during deployment:

1. Check the console for error messages
2. Verify all environment variables are set correctly
3. Test each component (wallet, swap, IP registration) individually
4. Check network connectivity and RPC endpoints

For platform-specific issues, consult:
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

---

*Last updated: [Current Date] - Always verify the latest configuration requirements*
