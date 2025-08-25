# SightEngine AI Detection Setup

SightEngine is a content moderation API that includes AI-generated content detection. It's the recommended service for detecting AI-generated images in the IP Gatekeeper.

## 🚀 Quick Setup

### 1. Create SightEngine Account
1. Go to [sightengine.com](https://sightengine.com/)
2. Click "Get Started" or "Sign Up"
3. Create your account

### 2. Get API Credentials
1. Login to your SightEngine dashboard
2. Go to **Settings** → **API Keys**
3. Copy your:
   - **API User** (usually numeric like `123456789`)
   - **API Secret** (long string like `ABC123xyz...`)

### 3. Add to Environment Variables
Add these to your `.env.local` file:

```bash
# SightEngine AI Detection
SIGHTENGINE_API_USER=your_api_user_here
SIGHTENGINE_API_SECRET=your_api_secret_here
```

### 4. Test the Integration
You can test if it's working by uploading an image in the IP Gatekeeper interface. The AI detection should show:
- Source: "sightengine" (instead of "simulation")
- More accurate AI confidence scores

## 📊 Pricing

SightEngine offers:
- **Free Tier**: 500 API calls/month
- **Paid Plans**: Starting from $19/month for 10,000 calls
- **Pay-as-you-go**: $0.002 per API call

For more details: [SightEngine Pricing](https://sightengine.com/pricing)

## 🔧 API Details

Our integration uses:
- **Endpoint**: `https://api.sightengine.com/1.0/check.json`
- **Model**: `genai` (AI-generated content detection)
- **Method**: POST with form data
- **Response**: Returns confidence score (0-1) for AI-generated content

## 🛠️ Troubleshooting

### Common Issues:

1. **"SightEngine API credentials not configured"**
   - Make sure both `SIGHTENGINE_API_USER` and `SIGHTENGINE_API_SECRET` are set
   - Restart your development server after adding environment variables

2. **"SightEngine API error: 401"**
   - Check if your API credentials are correct
   - Verify your account is active

3. **"SightEngine API error: 402"**
   - You've exceeded your API quota
   - Upgrade your plan or wait for monthly reset

4. **Falls back to simulation**
   - This is normal when SightEngine is not configured
   - The app will still work with simulated AI detection

### Debug Mode:
Check the browser console or server logs for detailed error messages when AI detection runs.

## 🔄 Fallback Behavior

If SightEngine is not configured or fails:
1. ✅ App continues to work normally
2. ✅ AI detection falls back to simulation mode
3. ✅ All other features remain functional
4. ⚠️ AI detection will be less accurate

This ensures your application is always functional, even without AI detection services.

## 📚 SightEngine Documentation

- [AI-Generated Detection Docs](https://sightengine.com/docs/ai-generated-detection)
- [API Reference](https://sightengine.com/docs/api-reference)
- [Getting Started Guide](https://sightengine.com/docs/getting-started)

## 🎯 Integration Benefits

Using SightEngine provides:
- ✅ **High Accuracy**: Professional-grade AI detection
- ✅ **Fast Response**: Usually <2 seconds
- ✅ **Reliable**: Enterprise-grade uptime
- ✅ **Comprehensive**: Detects various AI art styles
- ✅ **Up-to-date**: Constantly updated for new AI models

This makes your IP registration more accurate and trustworthy for creators and licensees.
