# Wellness Task Push Notifications - Testing Guide

## Quick Start Testing

### Prerequisites
- Modern web browser (Chrome, Firefox, or Edge recommended)
- Node.js and npm installed
- Repository cloned and dependencies installed

### Setup
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev
```

### Test Checklist

#### 1. Settings Configuration ✓
- [ ] Navigate to Settings page
- [ ] Find "Wellness & Notifications" section
- [ ] Toggle "Push Notifications" on
- [ ] Grant browser notification permission when prompted
- [ ] Click "Send Test Notification" button
- [ ] Verify notification appears

**Expected Result**: Browser notification appears with "Good Morning! 💪" title

#### 2. Daily Wellness Task Setup ✓
- [ ] Toggle "Daily Wellness Tasks" on
- [ ] Verify category selection appears
- [ ] Select at least 2 categories (e.g., "Communication" and "Mental Health")
- [ ] Set relationship status (default: "All")
- [ ] Customize morning notification time (optional)
- [ ] Toggle follow-up notifications (default: enabled)

**Expected Result**: All controls become active and save automatically

#### 3. Home Screen Task Display ✓
- [ ] Navigate to Home screen (Work tab)
- [ ] Scroll down past main workout card
- [ ] Verify WellnessTaskCard appears
- [ ] Check task description is visible
- [ ] Verify category chips display correctly
- [ ] Note the task categories match selected categories

**Expected Result**: Wellness task card displays with task text and category chips

#### 4. Task Completion ✓
- [ ] Click "Mark Complete" button on wellness task
- [ ] Verify button changes to "Completed!" with checkmark
- [ ] Observe celebration animation (trophy icon)
- [ ] Click expand arrow (down chevron)
- [ ] Verify "Total completed: 1" displays

**Expected Result**: Task marked complete, celebration animation plays, count updates

#### 5. Profile Statistics ✓
- [ ] Navigate to Settings
- [ ] Click "Profile Information"
- [ ] Scroll to statistics cards
- [ ] Locate "Wellness Tasks" card
- [ ] Verify count shows "1"

**Expected Result**: Wellness Tasks stat shows completed count

#### 6. Task Persistence ✓
- [ ] Refresh the browser page
- [ ] Navigate back to Home screen
- [ ] Verify task still shows as "Completed!"
- [ ] Check profile stats still show count

**Expected Result**: Completion persists across page reloads

#### 7. Category Filtering ✓
- [ ] Navigate to Settings
- [ ] Disable all categories except one (e.g., only "Physical")
- [ ] Navigate to Home screen
- [ ] Verify new task belongs to selected category
- [ ] Re-enable all categories

**Expected Result**: Task changes to match selected categories

#### 8. Notification Time Customization ✓
- [ ] In Settings, change morning notification time to current time + 1 minute
- [ ] Wait for notification to arrive
- [ ] Verify notification contains workout and wellness task

**Expected Result**: Notification arrives at scheduled time (browser must be open)

#### 9. Achievement Unlocking ✓
- [ ] Complete 1 wellness task
- [ ] Check for "Wellness Beginner" achievement
- [ ] Complete 9 more tasks (total 10)
- [ ] Check for "Wellness Explorer" achievement

**Expected Result**: Achievements unlock at milestones

#### 10. Error Handling ✓
- [ ] Deny notification permission when prompted
- [ ] Verify graceful error message
- [ ] Try to enable push notifications again
- [ ] Grant permission this time
- [ ] Verify successful setup

**Expected Result**: Appropriate error messages, successful recovery

## Browser-Specific Tests

### Chrome/Edge
- [ ] Full notification support
- [ ] Service worker registration
- [ ] Background notifications
- [ ] Notification click-to-open

### Firefox
- [ ] Notification support
- [ ] Service worker registration
- [ ] Permission prompts work correctly

### Safari
- [ ] Limited notification support (may not work on all versions)
- [ ] Graceful degradation
- [ ] Local notifications as fallback

## Advanced Testing

### LocalStorage Verification
```javascript
// Open browser console
// Check wellness task completions
JSON.parse(localStorage.getItem('wellness_completed_guest'))

// Check preferences
JSON.parse(localStorage.getItem('goodlift_preferences'))
```

### Service Worker Verification
```javascript
// Open browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

### Notification Permission Check
```javascript
// Open browser console
console.log('Notification permission:', Notification.permission);
```

## Expected Behaviors

### Task Selection Logic
- **Same day**: Same task shown all day (deterministic)
- **Next day**: Different task appears
- **Category change**: New task from new categories
- **Relationship status**: Tasks filtered appropriately

### Notification Timing
- **Morning**: Configured time (default 8:00 AM)
- **Follow-up**: Configured time (default 9:00 PM)
- **Weekly**: Sunday morning
- **Holiday**: Within a week of holiday

### Data Persistence
- **Task completions**: Stored in localStorage
- **Preferences**: Stored in localStorage (or Firebase if authenticated)
- **Stats**: Calculated from localStorage data
- **Achievements**: Checked against completion count

## Known Limitations

### Browser Notifications
- Require user interaction (can't auto-enable)
- May not work in all browsers (especially Safari)
- Background notifications require browser to be running
- Notification sounds vary by browser/OS

### Task Scheduling
- Current implementation uses client-side scheduling
- Requires app to be open for notifications
- Production should use server-side scheduling (Firebase Cloud Functions)

### Data Sync
- Guest users: LocalStorage only
- Authenticated users: Should sync to Firebase (future enhancement)

## Troubleshooting

### Issue: Notifications not appearing
**Solution**: 
1. Check browser notification permissions
2. Verify notifications enabled in OS settings
3. Try test notification
4. Check browser console for errors

### Issue: Task not showing
**Solution**:
1. Verify daily wellness tasks enabled
2. Check at least one category selected
3. Verify relationship status has matching tasks
4. Refresh page

### Issue: Completion not tracking
**Solution**:
1. Check localStorage quota not exceeded
2. Verify browser allows localStorage
3. Check browser console for errors
4. Clear cache and retry

### Issue: Service worker not registering
**Solution**:
1. Verify HTTPS or localhost
2. Check browser compatibility
3. Clear service worker cache
4. Hard refresh (Ctrl+Shift+R)

## Performance Checks

- [ ] Page load time under 3 seconds
- [ ] Settings save instantly
- [ ] Task completion animates smoothly
- [ ] No console errors or warnings
- [ ] No memory leaks during extended use
- [ ] Responsive on mobile devices

## Security Checks

- [ ] No sensitive data in console logs
- [ ] No XSS vulnerabilities
- [ ] LocalStorage data properly scoped
- [ ] Firebase config public keys only (expected)
- [ ] Service worker properly scoped to origin

## Accessibility Checks

- [ ] Keyboard navigation works
- [ ] Screen reader friendly labels
- [ ] Color contrast meets WCAG standards
- [ ] Touch targets at least 44x44px
- [ ] Focus indicators visible

## Success Criteria

✅ All core features functional
✅ No console errors
✅ Smooth animations
✅ Data persists correctly
✅ Achievements unlock properly
✅ Notifications work in supported browsers
✅ Settings save automatically
✅ Responsive on mobile
✅ Accessible to all users

## Reporting Issues

When reporting issues, include:
1. Browser and version
2. Operating system
3. Steps to reproduce
4. Expected vs actual behavior
5. Console errors (if any)
6. Screenshots (if applicable)

## Next Steps After Testing

1. ✅ All basic features work
2. ⏭️ Server-side notification scheduling (Firebase Cloud Functions)
3. ⏭️ Firebase data sync for authenticated users
4. ⏭️ Weekly task component
5. ⏭️ Holiday task detection
6. ⏭️ Completion history view
7. ⏭️ Category-based statistics
