# 🌱 Vegan Community Setup Guide

## Step 1: Install Supabase Dependency

First, install the Supabase client library:

```bash
npm install @supabase/supabase-js
```

## Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up/Login with GitHub (recommended)
4. Click "New Project"
5. Choose your organization
6. Fill in project details:
   - **Name**: `kaizo-vegan-community` (or any name you prefer)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose closest to your users
7. Click "Create new project"
8. Wait 2-3 minutes for setup to complete

## Step 3: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (long string starting with `eyJ`)

## Step 4: Configure Environment Variables

1. In your project root directory, create a `.env` file:

```bash
touch .env
```

2. Add your Supabase credentials to `.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Your existing Gemini API key (keep this)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Important**: Replace the placeholder values with your actual Supabase URL and anon key!

## Step 5: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste this SQL:

```sql
-- Create posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author TEXT,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    likes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    author TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.community_comments(post_id);

-- Create function for atomic likes
CREATE OR REPLACE FUNCTION public.community_like_post(p_post_id UUID)
RETURNS community_posts
LANGUAGE SQL
AS $$
    UPDATE community_posts
    SET likes = likes + 1
    WHERE id = p_post_id
    RETURNING *;
$$;
```

4. Click "Run" to execute the SQL

## Step 6: Enable Row Level Security (RLS)

1. Still in SQL Editor, run this security setup:

```sql
-- Enable Row Level Security
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read posts and comments
CREATE POLICY "posts_read" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "comments_read" ON public.community_comments FOR SELECT USING (true);

-- Allow anyone to create posts and comments
CREATE POLICY "posts_insert" ON public.community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "comments_insert" ON public.community_comments FOR INSERT WITH CHECK (true);

-- Allow likes function to run
GRANT EXECUTE ON FUNCTION public.community_like_post(UUID) TO anon, authenticated;
```

2. Click "Run" to execute

## Step 7: Test Your Setup

1. Restart your development server:

```bash
npm run dev
```

2. Navigate to the Community page (`/community`)
3. Try creating a post - it should work!
4. Open the Community page in two browser tabs
5. Post from one tab - it should appear instantly in the other tab!

## Step 8: Optional - Add Some Test Data

You can add some initial posts via SQL Editor:

```sql
INSERT INTO public.community_posts (author, content, tags, likes) VALUES
('Alice', 'Just found an amazing vegan restaurant in downtown! Their mushroom burger is incredible 🍄', ARRAY['restaurants', 'recommendations'], 5),
('Bob', 'Tips for meal prepping high-protein vegan meals? I''m training for a marathon and need ideas!', ARRAY['meal-prep', 'protein', 'fitness'], 3),
('Carol', 'Made cashew cheese for the first time - it''s so much better than store-bought! Recipe in comments', ARRAY['recipes', 'cheese'], 8);

-- Add a comment to the first post
INSERT INTO public.community_comments (post_id, author, content) 
SELECT id, 'David', 'What''s the name of the restaurant? I''d love to try it!'
FROM public.community_posts 
WHERE author = 'Alice' 
LIMIT 1;
```

## Troubleshooting

### Community shows "offline" message
- Check your `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after adding `.env` variables
- Check browser console for error messages

### Posts don't appear in real-time
- Check that broadcasts are working (open browser dev tools and look for WebSocket connections)
- Verify RLS policies are created correctly
- Make sure your Supabase project is not paused
- Posts will sync every 30 seconds via polling if real-time fails

### Permission errors
- Verify RLS policies are set up correctly
- Check that the `community_like_post` function has proper permissions

## Security Notes

This setup allows anonymous posting for simplicity. For production, consider:

1. **Authentication**: Add Supabase Auth for user accounts
2. **Rate limiting**: Implement posting frequency limits
3. **Content moderation**: Add reporting and admin features
4. **User profiles**: Link posts to authenticated user accounts

## Next Steps

Your Community page is now fully functional with:
- ✅ Real-time posting and commenting
- ✅ Live updates across all users
- ✅ Persistent data storage
- ✅ Tag filtering
- ✅ Like functionality

The community will work perfectly for multiple users simultaneously!
