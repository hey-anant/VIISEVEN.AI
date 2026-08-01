# Deployment Environment Variable Setup Guide

## Issue
The deployed project is getting a 500 error from `/api/gen-ai-code` because the `NEXT_PUBLIC_GEMINI_API_KEY` environment variable is not configured in your deployment environment.

## Solution

### For Vercel Deployment:

1. **Go to your Vercel Dashboard**
   - Navigate to your project
   - Click on "Settings"
   - Click on "Environment Variables"

2. **Add the following environment variable:**
   ```
   Name: NEXT_PUBLIC_GEMINI_API_KEY
   Value: [Your Gemini API Key]
   Environment: Production, Preview, Development (select all)
   ```

3. **Add any other required environment variables:**
   ```
   NEXT_PUBLIC_CONVEX_URL=[Your Convex URL]
   NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID_KEY=[Your Google OAuth Client ID]
   ```

4. **Redeploy your application:**
   - Go to "Deployments"
   - Click on the three dots (...) next to your latest deployment
   - Click "Redeploy"
   - OR: Push a new commit to trigger automatic redeployment

### For Other Platforms (Netlify, Railway, etc.):

1. Navigate to your project's environment variables settings
2. Add the same environment variables as listed above
3. Redeploy your application

## Verification

After redeployment, check your browser console. You should see:
- ✅ No "Gemini API key is not configured" errors
- ✅ AI responses working correctly
- ✅ No 500 errors from `/api/gen-ai-code` or `/api/ai-chat`

## Local Testing

To test locally before deploying:

1. Ensure your `.env.local` file contains:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   NEXT_PUBLIC_CONVEX_URL=your_convex_url_here
   NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID_KEY=your_google_client_id_here
   ```

2. Run the build command:
   ```bash
   npm run build
   ```

3. If successful, start the production server:
   ```bash
   npm start
   ```


