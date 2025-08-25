# 🎯 User Preferences & Personalization Setup

## Overview

This guide helps you set up the **User Preferences System** that stores onboarding data and personalizes the entire app experience. Users' dietary preferences and allergies will automatically influence **product scanning**, **recipe generation**, and **AI analysis**.

## Database Setup (Supabase)

### Step 1: Create User Preferences Table

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Create user_preferences table
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dietary_preference VARCHAR(20) NOT NULL CHECK (dietary_preference IN ('vegan', 'vegetarian')),
  allergies TEXT[] DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_dietary ON user_preferences(dietary_preference);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### Step 2: Set up Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);
```

### Step 3: Create Helper Functions

```sql
-- Function to get user preferences with fallback
CREATE OR REPLACE FUNCTION get_user_preferences(user_uuid UUID)
RETURNS TABLE (
  dietary_preference VARCHAR(20),
  allergies TEXT[],
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.dietary_preference,
    up.allergies,
    up.completed_at
  FROM user_preferences up
  WHERE up.user_id = user_uuid
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific allergy
CREATE OR REPLACE FUNCTION user_has_allergy(user_uuid UUID, allergy_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_allergies TEXT[];
BEGIN
  SELECT allergies INTO user_allergies
  FROM user_preferences
  WHERE user_id = user_uuid;
  
  IF user_allergies IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN allergy_name = ANY(user_allergies);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## How It Works

### 🔄 **Data Flow**

1. **Onboarding** → User selects diet + allergies → Stored in `user_preferences` table
2. **Scanning** → AI gets user preferences → Personalizes analysis with allergy alerts
3. **Recipes** → User preferences filter ingredients → Generate safe, suitable recipes
4. **Recommendations** → All suggestions respect dietary + allergy constraints

### 🧠 **AI Integration**

The system automatically enhances Gemini AI prompts with:

```typescript
// Example of how preferences are injected into AI
USER PREFERENCES: User is vegan.
CRITICAL ALLERGIES: nuts, soy. These ingredients must be completely avoided.

EXTRACTED TEXT FROM PRODUCT: "Contains milk, nuts, wheat..."

// AI will now prioritize allergy warnings and vegan analysis
```

### 🚨 **Allergy Safety System**

- **Priority Alerts**: Allergies appear first in scan results with ⚠️ icons
- **Smart Detection**: Checks ingredient text, AI analysis, and vegan ingredients
- **High Severity**: All allergy matches marked as "high" severity
- **Prominent Display**: Red badges and warning messages

### 📱 **User Experience**

- **Seamless**: Works automatically after onboarding
- **Fallback**: LocalStorage backup if Supabase unavailable  
- **Cross-Device**: Preferences sync across devices when logged in
- **Performance**: Cached for fast access, minimal API calls

## Testing Your Setup

### 1. **Complete Onboarding**
```bash
# Clear browser data to simulate new user
# Go to /onboarding
# Select "Vegan" + allergies like "Nuts, Soy"
# Complete login
```

### 2. **Test Scanning**
- Scan a product with nuts
- Should see: "⚠️ ALLERGY ALERT: Contains nuts" in red
- Vegan analysis should be personalized

### 3. **Verify Data**
```sql
-- Check if preferences are stored
SELECT * FROM user_preferences;

-- Test helper function
SELECT get_user_preferences('your-user-uuid');
```

## Features Included

### ✅ **Robust Storage**
- **Database**: Supabase with RLS security
- **Local Backup**: localStorage fallback
- **Caching**: In-memory cache for performance
- **Sync**: Cross-device synchronization

### ✅ **AI Personalization**
- **Smart Prompts**: User preferences injected into AI
- **Allergy Alerts**: Critical safety warnings
- **Diet Awareness**: Vegan/vegetarian specific analysis
- **Context**: Personalized recommendations

### ✅ **Error Handling**
- **Validation**: Input sanitization and checks
- **Fallbacks**: Multiple layers of backup
- **Logging**: Comprehensive error tracking
- **Recovery**: Graceful degradation

### ✅ **Performance**
- **Singleton Pattern**: Efficient service architecture
- **Lazy Loading**: Preferences loaded on demand
- **Caching**: Reduced database calls
- **Batch Operations**: Efficient data handling

## Future Enhancements

With this foundation, you can easily add:

1. **Profile Settings**: Allow users to update preferences
2. **Advanced Allergies**: Severity levels, cross-contamination warnings
3. **Dietary Goals**: Nutrition targets, health objectives
4. **Recipe Favorites**: Personalized recipe recommendations
5. **Analytics**: Usage patterns and preference insights

Your app now provides a **truly personalized experience** that keeps users safe and satisfied! 🌱✨
