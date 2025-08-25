# 🔐 Authentication Setup Guide

## Overview

This guide shows you how to set up **real Google OAuth authentication** for your Vegan Community app using Supabase Auth.

## Step 1: Configure Google OAuth in Supabase

### 1.1 Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Choose **Web application**
   - Add these to **Authorized redirect URIs**:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     http://localhost:5173/
     ```
   - Replace `your-project-ref` with your actual Supabase project reference
5. Copy your **Client ID** and **Client Secret**

### 1.2 Configure Supabase Auth

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and toggle it **ON**
3. Enter your Google OAuth credentials:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
4. Click **Save**

### 1.3 Configure Site URL

1. Still in **Authentication** → **Settings**
2. Set **Site URL** to: `http://localhost:5173` (for development)
3. Add **Redirect URLs**:
   ```
   http://localhost:5173/
   http://localhost:5173/**
   ```
4. Click **Save**

## Step 2: Environment Setup

You should already have these in your `.env` file from the Community setup:

```env
# Supabase Configuration (required for auth)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Your existing Gemini API key
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Step 3: Test Authentication

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/login` in your browser

3. Click **"Continue with Google"**

4. Complete the Google OAuth flow

5. You should be redirected back to your app and see:
   - Your profile picture in the top navigation
   - A welcome toast notification
   - Your name in the Community composer

## Step 4: Verify Database Integration

The authentication is integrated with your Community features:

1. **Posts**: Now use your real name from Google profile
2. **Comments**: Also use your authenticated identity
3. **User Menu**: Shows profile picture and email
4. **Persistence**: Works across browser sessions

## Features Included

### ✅ **What Works Now:**

- **Google OAuth Login**: Real authentication via Google
- **User Profile**: Shows Google profile picture and name
- **Automatic Sign-out**: Secure session management
- **Community Integration**: Posts/comments use real user identity
- **Mobile-Friendly**: Works on mobile navigation
- **Session Persistence**: Stays logged in across page refreshes
- **Graceful Fallback**: Works without auth for guest users

### 🔒 **Security Features:**

- **Supabase Auth**: Industry-standard authentication
- **OAuth 2.0**: Secure Google integration
- **Session Management**: Automatic token refresh
- **HTTPS Ready**: Works with production domains
- **CORS Protected**: Proper redirect URL validation

## Troubleshooting

### Google OAuth Issues

**"Error 400: redirect_uri_mismatch"**
- Check your Google Console redirect URIs match exactly
- Ensure you're using the correct Supabase project URL
- Verify no trailing slashes in redirect URIs

**"Error: Invalid OAuth provider"**
- Verify Google provider is enabled in Supabase
- Check your Client ID and Secret are correct
- Ensure Google+ API is enabled in Google Cloud

### Authentication Not Working

**"Supabase not configured" message**
- Check your `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after adding environment variables
- Verify Supabase project is not paused

**User not appearing in navigation**
- Check browser console for auth errors
- Verify OAuth flow completed successfully
- Try signing out and back in

### Community Features

**Posts showing "Guest" instead of user name**
- Verify you're signed in (check navigation bar)
- Refresh the Community page
- Check browser console for authentication errors

## Production Deployment

When deployinnpm g to production:

1. **Update Google OAuth**:
   - Add your production domain to Google Console redirect URIs
   - Example: `https://yourdomain.com/`

2. **Update Supabase**:
   - Set Site URL to your production domain
   - Add production redirect URLs

3. **Environment Variables**:
   - Set the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in production

## Next Steps

With authentication working, you can:

1. **Add User Profiles**: Create user profile pages
2. **Post Ownership**: Allow users to edit/delete their own posts
3. **Moderation**: Add admin features and content moderation
4. **Notifications**: Real-time notifications for mentions/replies
5. **Advanced Features**: User following, private messaging

Your Vegan Community now has **real authentication** with Google OAuth! 🎉
