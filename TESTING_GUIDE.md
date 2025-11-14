# End-to-End Testing Guide

This document provides comprehensive testing instructions for all platform features.

## Prerequisites

- API Server running on http://localhost:8000
- Web App running on http://localhost:3000
- Test user credentials or Google OAuth configured

---

## 1. Authentication & Authorization

### Test 1.1: Traditional Signup
**Steps:**
1. Go to http://localhost:3000/auth/signup
2. Fill in all fields:
   - Username: `testuser`
   - Email: `test@example.com`
   - Full Name: `Test User`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click "Create Account"

**Expected:**
- ✅ Account created successfully
- ✅ Auto-logged in
- ✅ Redirected to homepage
- ✅ User profile appears in navigation

### Test 1.2: Google OAuth Signup
**Steps:**
1. Go to http://localhost:3000/auth/signup
2. Click "Sign up with Google" button
3. Complete Google authentication

**Expected:**
- ✅ Google popup appears
- ✅ After authorization, account created
- ✅ Auto-logged in
- ✅ Username derived from email
- ✅ Redirected to homepage

### Test 1.3: Traditional Signin
**Steps:**
1. Go to http://localhost:3000/auth/signin
2. Enter credentials:
   - Username: `testuser`
   - Password: `password123`
3. Click "Sign In"

**Expected:**
- ✅ Successfully logged in
- ✅ Redirected to homepage
- ✅ User profile appears in navigation

### Test 1.4: Google OAuth Signin
**Steps:**
1. Go to http://localhost:3000/auth/signin
2. Click "Sign in with Google" button
3. Complete Google authentication

**Expected:**
- ✅ Google popup appears
- ✅ Successfully logged in
- ✅ Redirected to homepage

### Test 1.5: Logout
**Steps:**
1. Click on profile dropdown in navigation
2. Click "Sign Out"

**Expected:**
- ✅ Logged out successfully
- ✅ Redirected to homepage
- ✅ "Sign In" button appears

---

## 2. Navigation & UI

### Test 2.1: Homepage
**Steps:**
1. Go to http://localhost:3000

**Expected:**
- ✅ Hero section with gradient background
- ✅ Stats section (10K+ blocks, 500+ paths, 99.9% uptime)
- ✅ Features section with 3 cards
- ✅ CTA section at bottom
- ✅ Professional, subtle design
- ✅ Responsive layout

### Test 2.2: Navigation Dropdown
**Steps:**
1. Login as any user
2. Click on username/profile in navigation
3. Verify dropdown appears

**Expected:**
- ✅ Dropdown appears ON TOP of all content
- ✅ Shows user info (username, email, role)
- ✅ Profile, AI Agents, Settings options visible
- ✅ Dark Mode toggle works
- ✅ Sign Out button visible
- ✅ No z-index issues

### Test 2.3: Dark Mode
**Steps:**
1. Open profile dropdown
2. Click "Dark Mode" / "Light Mode" toggle

**Expected:**
- ✅ Theme switches immediately
- ✅ All components render correctly
- ✅ Preference persists on refresh

### Test 2.4: Mobile Navigation
**Steps:**
1. Resize browser to mobile width
2. Click hamburger menu

**Expected:**
- ✅ Mobile menu opens
- ✅ All navigation items visible
- ✅ Auth buttons work
- ✅ Menu closes when item clicked

---

## 3. Blocks Management

### Test 3.1: View Blocks List
**Steps:**
1. Go to http://localhost:3000/blocks

**Expected:**
- ✅ List of blocks displayed
- ✅ Each block shows title, description, tags
- ✅ Click on block opens detail page

### Test 3.2: View Block Detail
**Steps:**
1. Click on any block from list

**Expected:**
- ✅ Block content displayed
- ✅ Title and metadata visible
- ✅ "I Know This" button visible (if authenticated)
- ✅ Mastered state updates when clicked

### Test 3.3: Create Block Manually
**Steps:**
1. Go to http://localhost:3000/blocks/create
2. Fill in block details
3. Add content in editor
4. Click "Create Block"

**Expected:**
- ✅ Block created successfully
- ✅ Redirected to block detail page
- ✅ Content renders correctly

### Test 3.4: Mark Block as Mastered
**Steps:**
1. Open any block detail page
2. Click "I Know This" button

**Expected:**
- ✅ Button changes to "Mastered" with checkmark
- ✅ Green checkmark appears
- ✅ XP awarded (if implemented)

---

## 4. Paths Management

### Test 4.1: View Paths List
**Steps:**
1. Go to http://localhost:3000/paths

**Expected:**
- ✅ List of paths displayed
- ✅ Each path shows title, description, block count
- ✅ Click on path opens detail page

### Test 4.2: View Path Detail
**Steps:**
1. Click on any path from list

**Expected:**
- ✅ Path overview displayed
- ✅ Timeline of blocks shown
- ✅ Progress indicators visible
- ✅ Can click on blocks to view them

### Test 4.3: Create Path with Minimum Blocks
**Steps:**
1. Go to http://localhost:3000/paths/create
2. Try to add only 1 block

**Expected:**
- ✅ Warning message appears
- ✅ "Add 1 More Block" button shown
- ✅ Cannot create path with < 2 blocks

### Test 4.4: Create Path Successfully
**Steps:**
1. Go to http://localhost:3000/paths/create
2. Search and add 2+ blocks
3. Fill in path details
4. Click "Create Path"

**Expected:**
- ✅ Path created successfully
- ✅ Redirected to path detail page
- ✅ All blocks displayed in timeline

### Test 4.5: Mark Path as Mastered
**Steps:**
1. Open any path detail page
2. Click "Mark as Mastered" button

**Expected:**
- ✅ Path marked as mastered
- ✅ Progress updates
- ✅ Confirmation displayed

---

## 5. Search Functionality

### Test 5.1: Search Page Load
**Steps:**
1. Go to http://localhost:3000/search

**Expected:**
- ✅ Search page loads
- ✅ Search input visible
- ✅ Filters available

### Test 5.2: Search Input Alignment
**Steps:**
1. Click in search bar
2. Start typing

**Expected:**
- ✅ Text aligns perfectly with magnifier icon
- ✅ No visual offset
- ✅ Clear button (X) appears on right

### Test 5.3: Perform Search
**Steps:**
1. Enter search query: "python"
2. Press Enter or click search

**Expected:**
- ✅ Results displayed
- ✅ Shows matching blocks and paths
- ✅ Can filter by type
- ✅ Click on result navigates to detail

### Test 5.4: Empty Search Results
**Steps:**
1. Enter search query with no matches: "xyzabc123"
2. Press Enter

**Expected:**
- ✅ "No Results Found" message
- ✅ Suggestion to adjust filters
- ✅ Clear search button visible

---

## 6. AI Agent Configuration

### Test 6.1: View AI Agents
**Steps:**
1. Login with account that has `use_ai_agents` permission
2. Go to http://localhost:3000/ai-config

**Expected:**
- ✅ List of configured AI agents
- ✅ Each agent shows name, provider, model
- ✅ "Create AI Agent" button visible
- ✅ Edit (gear) and Delete (trash) buttons on each card

### Test 6.2: Create AI Agent
**Steps:**
1. Click "Create AI Agent"
2. Fill in form:
   - Name: "My Test Agent"
   - Provider: OpenAI
   - Model: gpt-4
   - Agent Type: Content Creator
   - API Key: (your key)
3. Click "Create Agent"

**Expected:**
- ✅ Agent created successfully
- ✅ Appears in list
- ✅ Modal closes

### Test 6.3: Edit AI Agent
**Steps:**
1. Click gear icon on any agent
2. Modify some fields
3. Click "Update Agent"

**Expected:**
- ✅ Form pre-populated with existing data
- ✅ Modal title shows "Edit AI Agent"
- ✅ Changes saved successfully
- ✅ List updates with new data

### Test 6.4: Delete AI Agent
**Steps:**
1. Click trash icon on any agent
2. Confirm deletion

**Expected:**
- ✅ Confirmation dialog appears
- ✅ Message: "Are you sure you want to delete '{name}'?"
- ✅ Agent removed from list after confirmation
- ✅ No errors

### Test 6.5: Use This Agent (Old Flow)
**Steps:**
1. Click "Use this agent" on any agent card

**Expected:**
- ✅ Navigates to /ai-config/[id]/create
- ✅ Page loads with agent info
- ✅ AIAssistant component rendered

---

## 7. AI Content Creation (New Dedicated Page)

### Test 7.1: Access Create Page
**Steps:**
1. Login with `use_ai_agents` permission
2. Click "Create with AI" in navigation

**Expected:**
- ✅ Navigates to http://localhost:3000/create
- ✅ Step indicator visible (1 of 4)
- ✅ Content type selection shown

### Test 7.2: Create Block with AI - Full Flow
**Steps:**
1. Go to http://localhost:3000/create
2. **Step 1**: Click "Create a Block"
3. **Step 2**: Select an AI agent
4. **Step 3**: Enter prompt:
   ```
   Create a beginner tutorial about Python list comprehensions with examples
   ```
5. Click "Generate with AI"
6. **Step 4**: Wait for generation (loading spinner)
7. **Step 5**: Review suggestion

**Expected:**
- ✅ Each step transitions smoothly
- ✅ Step indicator updates
- ✅ Can go back to previous steps
- ✅ Loading spinner shows progress
- ✅ WebSocket updates show real-time progress
- ✅ Suggestion appears with title, description, tags
- ✅ Can approve or reject suggestion

### Test 7.3: Create Path with AI - Full Flow
**Steps:**
1. Go to http://localhost:3000/create
2. **Step 1**: Click "Create a Path"
3. **Step 2**: Select an AI agent (course designer preferred)
4. **Step 3**: Enter prompt:
   ```
   Create a complete learning path for JavaScript fundamentals
   ```
5. Click "Generate with AI"
6. Wait for generation
7. Review suggestions

**Expected:**
- ✅ Same smooth flow as blocks
- ✅ Path-specific suggestions generated
- ✅ Shows multiple blocks in path structure
- ✅ Can approve to create full path

### Test 7.4: AI Generation Error Handling
**Steps:**
1. Start AI generation
2. Use invalid API key or trigger error

**Expected:**
- ✅ Error message displayed
- ✅ Returns to prompt step
- ✅ Can retry with corrections

### Test 7.5: AI Generation Cancellation
**Steps:**
1. Start AI generation
2. Navigate away or close browser

**Expected:**
- ✅ Job cancelled gracefully
- ✅ No hanging processes
- ✅ Can start new job

### Test 7.6: Progress Updates
**Steps:**
1. Start AI generation
2. Watch progress bar

**Expected:**
- ✅ Progress percentage updates
- ✅ Status messages change
- ✅ WebSocket connection stable
- ✅ Real-time updates without polling

---

## 8. Admin Settings

### Test 8.1: Access Settings (Admin Only)
**Steps:**
1. Login as admin user
2. Go to http://localhost:3000/settings

**Expected:**
- ✅ Settings page loads
- ✅ Google OAuth configuration section visible
- ✅ Setup instructions shown

### Test 8.2: Access Denied (Non-Admin)
**Steps:**
1. Login as regular user
2. Try to access http://localhost:3000/settings

**Expected:**
- ✅ Redirected to homepage
- ✅ No access to settings

### Test 8.3: Configure Google OAuth
**Steps:**
1. As admin, go to settings
2. Enter Google Client ID
3. Enter Google Client Secret
4. Click "Save OAuth Settings"

**Expected:**
- ✅ Credentials saved
- ✅ Success message displayed
- ✅ Redirect URI shown

### Test 8.4: Test OAuth Flow
**Steps:**
1. After configuring OAuth
2. Click "Test OAuth Flow"

**Expected:**
- ✅ Popup window opens
- ✅ Google OAuth initiated
- ✅ Success/failure message displayed
- ✅ Window closes automatically

---

## 9. API Documentation

### Test 9.1: Access API Docs
**Steps:**
1. Go to http://localhost:8000/docs

**Expected:**
- ✅ Swagger UI loads
- ✅ All endpoints listed
- ✅ Organized by tags (health, auth, blocks, paths, ai, etc.)
- ✅ v1.0.0 version shown
- ✅ Comprehensive API description visible

### Test 9.2: API Endpoint Testing
**Steps:**
1. In Swagger UI, expand any endpoint
2. Click "Try it out"
3. Fill in parameters
4. Click "Execute"

**Expected:**
- ✅ Request sent successfully
- ✅ Response displayed
- ✅ Status code correct
- ✅ Can authorize with bearer token

### Test 9.3: ReDoc Alternative
**Steps:**
1. Go to http://localhost:8000/redoc

**Expected:**
- ✅ ReDoc interface loads
- ✅ Same API information
- ✅ Alternative documentation view

---

## 10. Responsive Design

### Test 10.1: Mobile View
**Steps:**
1. Resize browser to mobile width (375px)
2. Navigate through all pages

**Expected:**
- ✅ All pages responsive
- ✅ Navigation collapses to hamburger
- ✅ Cards stack vertically
- ✅ Buttons full-width
- ✅ No horizontal scroll

### Test 10.2: Tablet View
**Steps:**
1. Resize browser to tablet width (768px)
2. Navigate through all pages

**Expected:**
- ✅ Layout adapts appropriately
- ✅ 2-column grids where appropriate
- ✅ All content accessible

### Test 10.3: Desktop View
**Steps:**
1. Resize browser to desktop width (1920px)
2. Navigate through all pages

**Expected:**
- ✅ Full layout displayed
- ✅ All features accessible
- ✅ No layout issues

---

## 11. Performance & Stability

### Test 11.1: Page Load Times
**Steps:**
1. Open DevTools Network tab
2. Navigate to various pages
3. Check load times

**Expected:**
- ✅ Homepage loads in < 2s
- ✅ API responses in < 500ms
- ✅ No console errors

### Test 11.2: WebSocket Stability
**Steps:**
1. Start AI content generation
2. Check WebSocket connection in DevTools

**Expected:**
- ✅ WebSocket connection established
- ✅ Real-time updates received
- ✅ No disconnections
- ✅ Reconnects if dropped

### Test 11.3: Error Recovery
**Steps:**
1. Disconnect network
2. Try various actions
3. Reconnect network

**Expected:**
- ✅ Graceful error messages
- ✅ Retry mechanisms work
- ✅ State recovers correctly

---

## 12. Security Testing

### Test 12.1: Protected Routes
**Steps:**
1. Logout
2. Try to access http://localhost:3000/create

**Expected:**
- ✅ Redirected to signin
- ✅ Cannot access without auth

### Test 12.2: Permission Checks
**Steps:**
1. Login as user without `use_ai_agents` permission
2. "Create with AI" link should not appear

**Expected:**
- ✅ Navigation item hidden
- ✅ Direct URL access denied

### Test 12.3: API Authorization
**Steps:**
1. Remove auth token from localStorage
2. Try to call protected API endpoint

**Expected:**
- ✅ 401 Unauthorized response
- ✅ Proper error handling

---

## Test Completion Checklist

- [ ] All authentication tests pass
- [ ] Navigation and UI tests pass
- [ ] Blocks management tests pass
- [ ] Paths management tests pass
- [ ] Search functionality tests pass
- [ ] AI agent configuration tests pass
- [ ] AI content creation tests pass
- [ ] Admin settings tests pass
- [ ] API documentation tests pass
- [ ] Responsive design tests pass
- [ ] Performance tests pass
- [ ] Security tests pass

---

## Known Issues & Notes

**Issue 1**: If Google OAuth is not configured, the Google login buttons should be hidden.
- **Status**: Check if `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set

**Issue 2**: AI generation requires valid API keys.
- **Status**: Configure in AI agent settings

**Issue 3**: WebSocket requires API server to be running.
- **Status**: Ensure API server on port 8000

---

## Reporting Issues

When reporting issues, please include:
1. Test number and name
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots if applicable
5. Browser and version
6. Console errors (if any)

---

**Last Updated**: 2025-11-14  
**Version**: 1.0.0  
**Platform**: No Time To Lie
