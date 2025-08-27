# Taskade Configuration Guide

This guide explains how to set up the centralized Taskade integration that works for all users with a single API key.

## 🔧 **Environment Configuration**

Create a `.env` file in your project root with these variables:

```bash
# Your Taskade API Key (get this from taskade.com/settings/api)
VITE_TASKADE_API_KEY=your_taskade_api_key_here

# Your Taskade Workspace ID (where all shopping lists will be created)
VITE_TASKADE_WORKSPACE_ID=your_workspace_id_here

# Optional: Folder ID within the workspace (leave empty for root level)
VITE_TASKADE_FOLDER_ID=your_folder_id_here
```

## 🔑 **Getting Your Taskade API Key**

### Step 1: Sign in to Taskade
- Go to [taskade.com](https://taskade.com)
- Sign in to your account

### Step 2: Generate API Key
- Click your profile picture → **Settings**
- Go to **"API & Integrations"** section
- Click **"Generate New API Key"**
- Give it a name (e.g., "Kaizo App Integration")
- Copy the generated key

### Step 3: Set Permissions
- Ensure your API key has **read/write access** to workspaces
- The key needs permission to **create projects** and **tasks**

## 🏢 **Getting Your Workspace ID**

### Method 1: From URL
1. Go to your Taskade workspace
2. Look at the URL: `https://taskade.com/workspace/[WORKSPACE_ID]/...`
3. Copy the `[WORKSPACE_ID]` part

### Method 2: From API Response
1. Use your API key to call: `GET https://api.taskade.com/v1/workspaces`
2. Find your workspace in the response
3. Copy the `id` field

## 📁 **Getting Your Folder ID (Optional)**

### Method 1: From URL
1. Navigate to a folder in your workspace
2. URL format: `https://taskade.com/workspace/[WORKSPACE_ID]/folder/[FOLDER_ID]/...`
3. Copy the `[FOLDER_ID]` part

### Method 2: From API Response
1. Call: `GET https://api.taskade.com/v1/workspaces/[WORKSPACE_ID]/folders`
2. Find your folder in the response
3. Copy the `id` field

## 🚀 **How It Works Now**

### **Before (User-Specific):**
- Each user needed their own Taskade API key
- Users had to connect their own accounts
- Complex connection flow for each user

### **After (Centralized):**
- **Single API key** works for all users
- **No user setup required** - just works automatically
- **All shopping lists** go to your designated workspace
- **User identification** through project names and tags

## 📱 **User Experience**

### **For Users:**
1. Click **"Generate Shopping List"**
2. Generate their shopping list
3. Click **"Sync to Taskade"** - **no setup required!**
4. Shopping list appears in your Taskade workspace

### **For You (Admin):**
1. Set up environment variables once
2. All users automatically use your Taskade account
3. Monitor all shopping lists in one place
4. No need to manage user connections

## 🔒 **Security Considerations**

### **API Key Security:**
- **Never commit** your `.env` file to version control
- **Rotate regularly** - generate new API keys periodically
- **Monitor usage** - check Taskade for unusual activity
- **Limit permissions** - only grant necessary API access

### **Data Privacy:**
- All shopping lists are visible in your Taskade workspace
- Users can see each other's lists (if they have access)
- Consider creating a dedicated workspace for this purpose
- Use folder organization to separate different user groups

## 📊 **Organization Strategy**

### **Recommended Structure:**
```
Your Taskade Workspace
├── 📁 Shopping Lists
│   ├── 🛒 Kaizo Shopping — Aug 26 - Sep 2 (user123)
│   ├── 🛒 Kaizo Shopping — Aug 26 - Sep 2 (user456)
│   └── 🛒 Kaizo Shopping — Sep 2 - Sep 9 (user789)
├── 📁 Other Projects
└── 📁 Team Collaboration
```

### **Naming Convention:**
- **Project Names**: `Kaizo Shopping — [Week Range] ([User ID])`
- **Tags**: Include user identification for easy filtering
- **Descriptions**: Show which user generated each list

## 🛠️ **Troubleshooting**

### **Common Issues:**

#### **"Taskade Not Configured"**
- Check your `.env` file exists
- Verify `VITE_TASKADE_API_KEY` is set
- Ensure `VITE_TASKADE_WORKSPACE_ID` is set

#### **"Sync Failed"**
- Verify your API key is valid
- Check workspace ID is correct
- Ensure API key has proper permissions

#### **"Permission Denied"**
- API key needs workspace access
- Workspace ID must be correct
- Check if folder ID is valid (if using folders)

### **Testing Your Setup:**
1. Set environment variables
2. Restart your development server
3. Try generating a shopping list
4. Check if it appears in your Taskade workspace

## 🔄 **Maintenance**

### **Regular Tasks:**
- **Monitor API usage** - check Taskade for rate limits
- **Archive old lists** - keep workspace organized
- **Update API key** - rotate keys periodically
- **Review permissions** - ensure minimal necessary access

### **Backup Strategy:**
- **Export important lists** - save critical shopping lists
- **Document configuration** - keep setup instructions updated
- **Test after updates** - verify integration still works

## 📈 **Scaling Considerations**

### **For Multiple Users:**
- Consider **folder organization** by user groups
- Use **tags** for better filtering and organization
- **Monitor workspace size** - archive old projects
- **Set up notifications** for new shopping lists

### **For Production:**
- Use **environment-specific** configuration files
- Implement **API key rotation** procedures
- Set up **monitoring** for API usage and errors
- Create **backup procedures** for critical data

---

## 🎯 **Quick Setup Checklist**

- [ ] Get Taskade API key from [taskade.com/settings/api](https://taskade.com/settings/api)
- [ ] Get workspace ID from your Taskade URL or API
- [ ] Optionally get folder ID for organization
- [ ] Create `.env` file with the three variables
- [ ] Restart your development server
- [ ] Test by generating a shopping list
- [ ] Verify it appears in your Taskade workspace

**That's it! All users can now sync shopping lists without any setup.** 🚀✨
