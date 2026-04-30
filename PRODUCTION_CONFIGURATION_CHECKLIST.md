# Production Configuration Checklist

## ✅ Completed Changes (Already Done)

### 1. Backend CORS Configuration
- **File**: `prepmate-backend/server.js`
- **Change**: Updated CORS middleware to accept both production URLs:
  ```
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "https://iprepmate.vercel.app"
  ]
  ```
- **Impact**: Frontend at `https://iprepmate.vercel.app` can now make requests to backend
- ✅ Status: DONE

### 2. Socket.IO CORS Configuration
- **File**: `prepmate-backend/server.js`
- **Change**: Updated Socket.IO CORS to match HTTP CORS configuration
- **Impact**: Real-time WebSocket connections work from production frontend
- ✅ Status: DONE

### 3. Gmail SMTP Email Configuration
- **File**: `prepmate-backend/.env`
- **Changes**:
  ```
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=k844121@gmail.com
  SMTP_PASS=gcvu zhvo rjzq wvrx
  SMTP_FROM_NAME=iPrepmate
  SMTP_FROM_EMAIL=k844121@gmail.com
  ```
- **Impact**: All emails now sent via Gmail SMTP instead of SendGrid
- ✅ Status: DONE

### 4. Professional Email Templates
- **File**: `prepmate-backend/utils/emailService.js`
- **Changes Made**:
  - ✅ Verification Email: Professional design, no AI tone, no emojis, "iPrepmate" branding
  - ✅ Password Reset Email: Professional design, no AI tone, no emojis, "iPrepmate" branding
  - ✅ Welcome Email: Professional design, no AI tone, no emojis, "iPrepmate" branding
- **Features**:
  - Modern CSS styling with clean layout
  - Consistent branding using "iPrepmate" name
  - Professional language throughout
  - Zero emojis or AI-generated tone
- ✅ Status: DONE

### 5. Google OAuth Production URLs
- **File**: `prepmate-backend/.env`
- **Change**:
  ```
  GOOGLE_CALLBACK_URL=https://prepmate-s8v6.onrender.com/api/auth/google/callback
  ```
- **Impact**: Google OAuth redirect matches production backend URL
- ✅ Status: DONE

### 6. Environment Variables Updated
- **Backend (.env)**: 
  - ✅ BASE_URL → https://prepmate-s8v6.onrender.com
  - ✅ FRONTEND_URL → https://iprepmate.vercel.app
  - ✅ NODE_ENV → production
  - ✅ Gmail SMTP credentials configured
  - ✅ Google OAuth callback URL updated
  
- **Frontend (.env)**:
  - ✅ REACT_APP_API_BASE_URL → https://prepmate-s8v6.onrender.com/api
  - ✅ REACT_APP_BACKEND_URL → https://prepmate-s8v6.onrender.com
  - ✅ REACT_APP_GOOGLE_CLIENT_ID configured

### 7. SMS Configuration Removed
- **File**: `prepmate-backend/routes/users.js`
- **Change**: SMS validation commented out, no longer processed
- **Impact**: SMS notifications feature disabled
- ✅ Status: DONE

### 8. Environment File Examples Updated
- **File**: `prepmate-backend/env.example`
- **Changes**: 
  - ✅ SMTP configuration documented
  - ✅ Production URLs with comments
  - ✅ SendGrid config marked as legacy (optional)
- ✅ Status: DONE

---

## ⚠️ Required Actions in Render Dashboard

### Step 1: Update Backend Environment Variables on Render

1. Go to: https://dashboard.render.com
2. Select your backend service: `prepmate-s8v6`
3. Go to **Settings** → **Environment**
4. Click **Edit Environment**
5. Add/Update these variables:

```
FRONTEND_URL=https://iprepmate.vercel.app
BASE_URL=https://prepmate-s8v6.onrender.com
NODE_ENV=production

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=k844121@gmail.com
SMTP_PASS=gcvu zhvo rjzq wvrx
SMTP_FROM_NAME=iPrepmate
SMTP_FROM_EMAIL=k844121@gmail.com

GOOGLE_CLIENT_ID=194395885107-r3d8u1ash0oeujv9b1gs1jnffmbq2jio.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://prepmate-s8v6.onrender.com/api/auth/google/callback

# Keep existing variables:
# MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, etc.
```

6. Click **Save Changes**
7. Service will auto-redeploy with new variables

### Step 2: Verify Backend Email Configuration

1. After redeployment, test email by:
   - Go to backend health check: https://prepmate-s8v6.onrender.com/health
   - Trigger a password reset request from frontend
   - Check that email from `k844121@gmail.com` arrives

---

## ⚠️ Required Actions in Vercel Dashboard

### Step 1: Update Frontend Environment Variables on Vercel

1. Go to: https://vercel.com
2. Select your project: `iprepmate`
3. Go to **Settings** → **Environment Variables**
4. Add/Update these variables:

```
REACT_APP_API_BASE_URL=https://prepmate-s8v6.onrender.com/api
REACT_APP_BACKEND_URL=https://prepmate-s8v6.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=194395885107-r3d8u1ash0oeujv9b1gs1jnffmbq2jio.apps.googleusercontent.com
REACT_APP_GEMINI_API_KEY=AIzaSyDXgO00lKetJLvm3pdvG7zWBDAecR1-vnM
REACT_APP_GEMINI_MODEL=gemini-2.5-flash-preview-native-audio-dialog
REACT_APP_CLOUDINARY_CLOUD_NAME=chaman
```

5. Click **Save**
6. Vercel will auto-rebuild and redeploy

### Step 2: Verify Deployments

1. Redeploy frontend to pick up new env vars:
   - Push to `main` branch or manually trigger redeploy
   - Wait for build to complete

---

## 🧪 Testing Checklist

After applying the above changes, test the following:

### 1. CORS Connection (Frontend → Backend)
- [ ] Navigate to https://iprepmate.vercel.app
- [ ] Open DevTools Console (F12)
- [ ] Check that API calls don't show CORS errors
- [ ] Example: Make a profile fetch call
- Expected: No "CORS policy" errors in console

### 2. Email Verification
- [ ] Create a new account or request password reset
- [ ] Check email inbox at `k844121@gmail.com`
- [ ] Email should have:
  - [ ] "iPrepmate" branding in sender name
  - [ ] Professional, clean design (no emojis)
  - [ ] No AI-generated tone
  - [ ] Proper call-to-action button

### 3. Google OAuth Sign-In
- [ ] Go to https://iprepmate.vercel.app/signin
- [ ] Click "Sign in with Google" or similar button
- [ ] You should be redirected to Google login
- [ ] After logging in with Gmail, you should be redirected back to frontend
- [ ] You should be logged in with your Gmail email address
- **Note**: If this fails, ensure:
  - Google Client ID is correct in Vercel env vars
  - Google OAuth app has `https://iprepmate.vercel.app` as authorized redirect URI
  - Backend callback URL matches `GOOGLE_CALLBACK_URL` in Render

### 4. Password Reset Flow
- [ ] Request password reset
- [ ] Email should arrive from `k844121@gmail.com`
- [ ] Click link in email (should use `https://iprepmate.vercel.app/reset-password/...`)
- [ ] Password reset form should appear
- [ ] Reset password successfully

### 5. WebSocket Connection
- [ ] Test real-time features (chat, notifications, etc.)
- [ ] Open DevTools Network tab → WS filter
- [ ] Should see WebSocket connection to `wss://prepmate-s8v6.onrender.com`
- [ ] No connection errors

---

## 🔐 Google OAuth Setup

If Gmail sign-in is not working, check Google Cloud Console:

### For Google OAuth Redirect URIs:

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID credential
5. Click on it to edit
6. Under **Authorized redirect URIs**, add BOTH:
   - `https://prepmate-s8v6.onrender.com/api/auth/google/callback` (backend)
   - `https://iprepmate.vercel.app` (frontend, if your frontend has direct OAuth flow)
7. Click **Save**

### For Frontend Google Sign-In:

If using Google Sign-In button on frontend:
1. Make sure `REACT_APP_GOOGLE_CLIENT_ID` is set correctly in Vercel
2. Frontend should use this ID in Google Sign-In component
3. It should redirect to backend OAuth endpoint or use direct backend call

---

## 📋 Files Modified Summary

1. **prepmate-backend/server.js**
   - CORS configuration updated for production URLs
   - Socket.IO CORS updated

2. **prepmate-backend/utils/emailService.js**
   - Email templates redesigned (professional, iPrepmate branding)
   - From address now uses SMTP_FROM_NAME and SMTP_FROM_EMAIL

3. **prepmate-backend/.env**
   - Production URLs configured
   - Gmail SMTP credentials configured
   - NODE_ENV set to production
   - Google OAuth callback URL updated

4. **prepmate-backend/env.example**
   - Added SMTP configuration documentation
   - Added production URL comments
   - Marked SendGrid as legacy

5. **prepmate-backend/routes/users.js**
   - SMS validation commented out

6. **prepmate-landing/.env**
   - Backend API URL updated to production
   - Google Client ID configured

7. **prepmate-landing/.env.example**
   - Backend API URL examples updated
   - Google OAuth configuration documented

---

## 🚀 Final Steps

1. ✅ Code changes are done - just commit and push
2. ⚠️ Update Render environment variables (see above)
3. ⚠️ Update Vercel environment variables (see above)
4. 🧪 Run through testing checklist
5. ✅ Your platform should be fully connected!

---

## 🔧 Troubleshooting

### CORS errors: "No 'Access-Control-Allow-Origin' header"
- Verify `FRONTEND_URL` is set correctly on Render
- Check that both localhost and production URLs are in CORS list in server.js

### Email not sending
- Verify Gmail SMTP credentials in Render env vars
- Check that "Less secure app access" is enabled or using app password (which you are)
- Test sending email from backend logs

### Google OAuth fails
- Check that redirect URIs are registered in Google Cloud Console
- Verify Client ID and Secret in both Render and Vercel
- Check browser console for specific OAuth error messages

### WebSocket connection fails
- Ensure Socket.IO CORS includes production frontend URL
- Check Render logs for connection errors
- Verify no firewall blocking WebSocket connections

---

## 📧 Email Template Examples

All email templates now follow this format:
- **Professional layout** with clean CSS styling
- **"iPrepmate" branding** in sender name and headers
- **No emojis** or AI-generated language
- **Clear call-to-action buttons** with secure HTTPS links
- **Responsive design** for mobile and desktop
- **Security notices** where appropriate

Templates updated:
1. Verification Email
2. Password Reset Email  
3. Welcome Email
4. (Any other notification emails will use this same professional standard)

---

## ✨ What's Next?

Once everything is working:
- [ ] Monitor Render logs for any email errors
- [ ] Test all user flows (signup, login, password reset, OAuth)
- [ ] Verify no console errors on frontend
- [ ] Test with different browsers/devices
- [ ] Set up error monitoring/logging for production
