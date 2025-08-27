# Taskade Integration Setup Guide

This guide will walk you through setting up the real Taskade integration for the Kaizo meal planner shopping list feature.

## 🚀 Quick Start

1. **Get Your Taskade API Key** (see detailed steps below)
2. **Click "Generate Shopping List"** in the meal planner
3. **Click "Connect Taskade"** to set up your connection
4. **Enter your API key** and select workspace/folder
5. **Generate and sync** your shopping lists to Taskade!

## 🔑 Getting Your Taskade API Key

### Step 1: Sign in to Taskade
- Go to [taskade.com](https://taskade.com)
- Sign in to your account (or create one if you don't have it)

### Step 2: Access API Settings
- Click on your profile picture in the top-right corner
- Select **"Settings"** from the dropdown menu
- In the left sidebar, click **"API & Integrations"**

### Step 3: Generate API Key
- Scroll down to the **"API Keys"** section
- Click **"Generate New API Key"**
- Give your key a descriptive name (e.g., "Kaizo Meal Planner")
- Click **"Generate"**

### Step 4: Copy Your API Key
- **IMPORTANT**: Copy the generated API key immediately
- The key will only be shown once for security reasons
- Store it securely - you'll need it to connect Kaizo to Taskade

## 🔗 Connecting Kaizo to Taskade

### Step 1: Open the Shopping List Modal
- In the meal planner, click **"Generate Shopping List"**
- Generate a shopping list from your planned meals
- Click **"Connect Taskade"** button

### Step 2: Enter Your API Key
- Paste your Taskade API key in the input field
- Click **"Connect to Taskade"**
- The system will test your connection and load your workspaces

### Step 3: Select Workspace and Folder
- Choose your preferred **Workspace** from the dropdown
- Optionally select a **Folder** (or leave as "No folder" for root level)
- Click **"Use This Connection"**

### Step 4: Sync Your Shopping List
- Once connected, click **"Sync to Taskade"**
- Your shopping list will be created as a new Taskade project
- Each ingredient becomes a checklist item organized by category

## 📱 What Gets Created in Taskade

### Project Structure
```
Kaizo Shopping — Aug 26 - Sep 2
├── 🛒 Produce
│   ├── ☐ Fresh Spinach (2 cups)
│   ├── ☐ Onion (0.5 medium)
│   └── ☐ Sweet Potato (1 medium)
├── 🛒 Pantry
│   ├── ☐ Rolled Oats (1 cup)
│   ├── ☐ Mixed Nuts (0.5 cup)
│   └── ☐ Maple Syrup (2 tbsp)
├── 🛒 Refrigerated
│   └── ☐ Firm Tofu (1 block)
└── 🛒 Frozen
    └── ☐ Mixed Berries (1 cup)
```

### Task Details
Each shopping item includes:
- **Title**: Item name with checkbox
- **Description**: Quantity and unit information
- **Tags**: Category, "Shopping Item", "Kaizo"
- **Recipe References**: Which meals use each ingredient

## 🔄 How It Works

### 1. **Meal Planning** → **Ingredient Extraction**
- Kaizo analyzes your planned meals for the week
- Extracts ingredients from the recipe database
- Aggregates quantities and removes duplicates

### 2. **Smart Categorization**
- Groups ingredients by shopping categories (Produce, Pantry, etc.)
- Optimizes for efficient grocery store navigation
- Maintains recipe context for each ingredient

### 3. **Taskade Sync**
- Creates a new project in your selected workspace/folder
- Generates organized sections for each category
- Creates checklist items for each shopping item
- Links back to your meal planner for reference

### 4. **Mobile Shopping**
- Access your shopping list on mobile via Taskade app
- Check off items as you shop
- All changes sync back to your Taskade account

## 🛠️ Troubleshooting

### Connection Issues
- **"Connection Failed"**: Double-check your API key
- **"Failed to Load Workspaces"**: Verify your API key has proper permissions
- **"Sync Failed"**: Check your internet connection and try again

### API Key Problems
- **Key not working**: Generate a new API key
- **Permission denied**: Ensure your Taskade account is active
- **Rate limited**: Wait a few minutes and try again

### Missing Features
- **No workspaces shown**: Your API key might not have access to workspaces
- **Can't create projects**: Check if you have permission to create projects in the selected workspace
- **Folders not loading**: Some workspaces might not have folders

## 🔒 Security & Privacy

### API Key Security
- **Never share** your API key publicly
- **Store securely** - consider using a password manager
- **Rotate regularly** - generate new keys periodically
- **Revoke old keys** - delete unused API keys from Taskade

### Data Privacy
- Kaizo only stores your API key locally (encrypted)
- No shopping list data is stored on Kaizo servers
- All data flows directly between your device and Taskade
- You can disconnect at any time to remove access

## 📋 Best Practices

### 1. **Organize Your Taskade Workspace**
- Create a dedicated folder for "Shopping Lists" or "Meal Planning"
- Use consistent naming conventions for projects
- Archive old shopping lists to keep things organized

### 2. **Optimize Your Shopping Experience**
- Generate lists for specific weeks to avoid overwhelming lists
- Use the meal type filters to focus on specific meal categories
- Review and edit the generated list before syncing

### 3. **Maintain Your Recipe Database**
- Add new recipes to the Kaizo database for better ingredient extraction
- Update ingredient quantities and categories as needed
- Ensure recipe names match exactly between meal planner and database

## 🚀 Advanced Features

### Custom Categories
- The system automatically categorizes ingredients
- Categories are based on the recipe database
- You can request custom category mappings

### Recipe Linking
- Each ingredient shows which recipes use it
- Click on recipe names to see meal planning context
- Useful for understanding why you need specific ingredients

### Multi-Week Planning
- Generate shopping lists for different time periods
- Compare lists across weeks
- Plan for special occasions or meal prep sessions

## 📞 Support

If you encounter issues:

1. **Check this guide** for common solutions
2. **Verify your API key** is correct and active
3. **Test your Taskade connection** in the Taskade web app
4. **Check your internet connection** and try again
5. **Contact support** if problems persist

## 🔄 Future Enhancements

Planned features for upcoming versions:
- **Two-way sync** - Check off items in Taskade, update Kaizo
- **Pantry integration** - Subtract items you already have
- **Store-specific organization** - Optimize for your local grocery store
- **Collaborative shopping** - Share lists with family members
- **Automated generation** - Weekly shopping list reminders

---

**Happy meal planning and shopping! 🛒✨**
