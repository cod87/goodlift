# Avatar Upload Testing Guide

## Overview
This guide provides comprehensive testing procedures for the avatar upload functionality in the GoodLift app.

## Pre-Deployment Testing

### 1. Build and Code Quality Tests
- [x] ✅ Run `npm run build` - Build succeeds
- [x] ✅ Run `npm run lint` - No errors in modified files
- [x] ✅ Run CodeQL security scan - 0 alerts

### 2. Firebase Console Setup (Required Before Testing)
- [ ] Log into Firebase Console (https://console.firebase.google.com/)
- [ ] Navigate to project: goodlift-7760a
- [ ] Go to Storage section
- [ ] Enable Storage if not already enabled
- [ ] Deploy security rules from `FIREBASE_STORAGE_SETUP.md`
- [ ] Verify storage bucket URL: `goodlift-7760a.firebasestorage.app`

## Functional Testing

### Test Case 1: Authenticated User - Successful Upload
**Objective**: Verify authenticated users can upload avatars successfully

**Prerequisites**: 
- User must be signed in (not guest mode)
- Firebase Storage enabled and rules deployed

**Steps**:
1. Sign in to the app as a registered user
2. Navigate to Profile screen
3. Click on current avatar
4. Select "Upload Custom" tab
5. Click "Choose Image" button
6. Select a valid image (JPEG/PNG/WebP, < 5MB)
7. Wait for upload to complete

**Expected Results**:
- ✅ Upload progress shows "Uploading..." message
- ✅ No error messages appear
- ✅ Preview shows the new avatar
- ✅ "Save" button becomes enabled
- ✅ Console logs show successful upload with metrics
- ✅ After clicking "Save", avatar appears in profile

**Console Logs to Check**:
```
[AvatarUtils] Starting image compression
[AvatarUtils] Image loaded for compression
[AvatarUtils] Image compressed successfully
[AvatarUtils] Starting avatar upload
[AvatarUtils] Avatar uploaded successfully
[AvatarUtils] Download URL retrieved
```

### Test Case 2: Guest User - Upload Blocked
**Objective**: Verify guest users cannot upload custom avatars

**Prerequisites**: 
- User in guest mode (not signed in)

**Steps**:
1. Continue as guest or sign out
2. Navigate to Profile screen
3. Click on avatar
4. Select "Upload Custom" tab
5. Try to select an image

**Expected Results**:
- ✅ Error message: "Please sign in to upload custom avatars. Guest users can only use preset avatars."
- ✅ Upload button disabled or blocked
- ✅ No upload attempt made

### Test Case 3: File Size Validation
**Objective**: Verify files larger than 5MB are rejected

**Prerequisites**: 
- User signed in
- Have a test image > 5MB

**Steps**:
1. Sign in to the app
2. Navigate to Profile screen
3. Click on avatar → "Upload Custom" tab
4. Select an image larger than 5MB

**Expected Results**:
- ✅ Error message: "File is too large. Maximum size is 5MB."
- ✅ No upload attempted
- ✅ No preview shown

### Test Case 4: Invalid File Type
**Objective**: Verify non-image files are rejected

**Prerequisites**: 
- User signed in
- Have a non-image file (e.g., PDF, TXT, MP3)

**Steps**:
1. Sign in to the app
2. Navigate to Profile screen
3. Click on avatar → "Upload Custom" tab
4. Try to select a non-image file

**Expected Results**:
- ✅ File picker may filter out non-image types
- ✅ If selected: Error message "Invalid file type. Please upload a JPEG, PNG, or WebP image."
- ✅ No upload attempted

### Test Case 5: Image Compression
**Objective**: Verify images are compressed before upload

**Prerequisites**: 
- User signed in
- Have a large (but < 5MB) image

**Steps**:
1. Sign in to the app
2. Open browser console
3. Navigate to Profile → avatar → "Upload Custom"
4. Select a large image (e.g., 2000x2000px, 3MB)
5. Watch console logs

**Expected Results**:
- ✅ Console shows: "Starting image compression"
- ✅ Console shows: "Image compressed successfully" with size reduction
- ✅ Compression ratio logged (e.g., "75.3%")
- ✅ Upload uses compressed version (should be < 100KB)

### Test Case 6: Network Error Handling
**Objective**: Verify graceful handling of network errors

**Prerequisites**: 
- User signed in
- Browser DevTools open

**Steps**:
1. Sign in to the app
2. Open DevTools → Network tab
3. Set throttling to "Offline"
4. Navigate to Profile → avatar → "Upload Custom"
5. Try to upload an image
6. Restore network connection

**Expected Results**:
- ✅ Error message about network issues
- ✅ User can retry after network restoration
- ✅ No app crash

### Test Case 7: Permission Denied (No Rules)
**Objective**: Verify error handling when Firebase Storage rules block upload

**Prerequisites**: 
- User signed in
- Firebase Storage rules NOT deployed or set to deny

**Steps**:
1. Sign in to the app
2. Try to upload an avatar
3. Check error message

**Expected Results**:
- ✅ Error message: "Permission denied. Please ensure you are signed in and have permission to upload images."
- ✅ Console logs show error details
- ✅ User can dismiss error and try again

### Test Case 8: Very Small Image
**Objective**: Verify handling of images smaller than minimum dimensions

**Prerequisites**: 
- User signed in
- Have an image smaller than 10x10 pixels

**Steps**:
1. Sign in to the app
2. Navigate to Profile → avatar → "Upload Custom"
3. Select a very small image (e.g., 5x5 pixels)

**Expected Results**:
- ✅ Error message: "Image is too small. Please use an image at least 10x10 pixels."
- ✅ No upload attempted

### Test Case 9: Corrupted Image File
**Objective**: Verify handling of corrupted or invalid image data

**Prerequisites**: 
- User signed in
- Have a corrupted image file (e.g., rename .txt to .jpg)

**Steps**:
1. Sign in to the app
2. Navigate to Profile → avatar → "Upload Custom"
3. Select the corrupted image file

**Expected Results**:
- ✅ Error message about corrupted or unsupported format
- ✅ No crash
- ✅ User can try again with a valid image

### Test Case 10: Avatar Persistence
**Objective**: Verify uploaded avatar persists across sessions

**Prerequisites**: 
- User signed in
- Avatar already uploaded

**Steps**:
1. Upload a custom avatar (follow Test Case 1)
2. Note the avatar appearance
3. Sign out of the app
4. Sign back in
5. Navigate to Profile screen

**Expected Results**:
- ✅ Same custom avatar appears
- ✅ Avatar URL loaded from Firebase Storage
- ✅ No need to re-upload

## Verification in Firebase Console

After successful upload:
1. Go to Firebase Console → Storage
2. Navigate to `avatars/` folder
3. Find `{userId}/avatar.jpg` file
4. Verify file exists and has correct size (~20-100KB after compression)
5. Check file metadata shows correct content type (image/jpeg)

## Performance Testing

### Upload Speed Test
1. Upload a 2MB image
2. Measure time from selection to completion
3. Expected: < 10 seconds on good connection

### Compression Metrics
1. Upload various image sizes
2. Check console logs for compression ratios
3. Expected: 70-90% size reduction for large images
4. Expected: Final size always < 100KB

## Browser Compatibility Testing

Test in multiple browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Error Recovery Testing

### Test Case 11: Cancel Upload
**Objective**: Verify upload can be canceled

**Steps**:
1. Start uploading a large file
2. Close the dialog during upload
3. Reopen avatar selector

**Expected Results**:
- ✅ Upload is canceled
- ✅ No partial files saved
- ✅ Can start new upload

### Test Case 12: Multiple Uploads
**Objective**: Verify system handles multiple upload attempts

**Steps**:
1. Upload avatar A
2. Immediately upload avatar B
3. Verify final state

**Expected Results**:
- ✅ Avatar B overwrites avatar A
- ✅ Only one file exists in Firebase Storage
- ✅ Latest upload is shown

## Security Testing

### Test Case 13: Path Traversal Prevention
**Objective**: Verify users cannot upload to other users' folders

**Prerequisites**: 
- Two different user accounts

**Steps**:
1. Sign in as User A
2. Upload an avatar
3. Check Firebase Storage path
4. Sign in as User B
5. Upload an avatar
6. Check Firebase Storage path

**Expected Results**:
- ✅ User A's avatar in `avatars/userA_id/avatar.jpg`
- ✅ User B's avatar in `avatars/userB_id/avatar.jpg`
- ✅ Users cannot access each other's folders
- ✅ Security rules enforce isolation

### Test Case 14: Authentication Required
**Objective**: Verify unauthenticated requests are blocked

**Steps**:
1. Sign out of the app
2. Try to upload (should be blocked as guest)
3. Verify error message

**Expected Results**:
- ✅ Upload blocked at UI level
- ✅ Clear error message shown
- ✅ No Firebase Storage access attempted

## Regression Testing

Verify existing functionality still works:
- [ ] Preset avatars still selectable
- [ ] Avatar color options work
- [ ] Profile saving works
- [ ] Avatar displays in all locations (header, profile, etc.)

## Post-Deployment Monitoring

After deployment, monitor for:
1. Upload success rate (should be > 95%)
2. Average upload time
3. Common error types
4. Browser-specific issues
5. Network error frequency

## Troubleshooting Common Issues

### Issue: "Firebase Storage is not configured"
**Check**: 
- Firebase Console → Storage enabled?
- `firebase.js` has correct storage bucket URL
- App restarted after Firebase config changes

### Issue: "Permission denied"
**Check**:
- Security rules deployed in Firebase Console
- User is authenticated (not guest)
- Rules allow write to `avatars/{userId}/`

### Issue: Upload succeeds but image doesn't display
**Check**:
- Security rules allow read access
- Download URL saved to user profile
- Browser console for CORS errors
- Image URL is accessible (try opening in new tab)

### Issue: Compression fails
**Check**:
- Image format is supported (JPEG, PNG, WebP)
- Image is not corrupted
- Browser supports Canvas API
- Console for specific error messages

## Checklist Before Release

- [ ] All functional tests passed
- [ ] Security tests passed
- [ ] Performance acceptable
- [ ] Tested in major browsers
- [ ] Firebase Storage enabled
- [ ] Security rules deployed
- [ ] Documentation reviewed
- [ ] Error messages are user-friendly
- [ ] Logging provides debugging info
- [ ] No console errors in happy path

---

## Test Results Template

```
Date: _______________
Tester: _______________
Environment: _______________

Test Case Results:
[ ] TC1: Authenticated Upload - PASS/FAIL
[ ] TC2: Guest User Blocked - PASS/FAIL
[ ] TC3: File Size Validation - PASS/FAIL
[ ] TC4: Invalid File Type - PASS/FAIL
[ ] TC5: Image Compression - PASS/FAIL
[ ] TC6: Network Error - PASS/FAIL
[ ] TC7: Permission Denied - PASS/FAIL
[ ] TC8: Small Image - PASS/FAIL
[ ] TC9: Corrupted Image - PASS/FAIL
[ ] TC10: Persistence - PASS/FAIL
[ ] TC11: Cancel Upload - PASS/FAIL
[ ] TC12: Multiple Uploads - PASS/FAIL
[ ] TC13: Path Traversal - PASS/FAIL
[ ] TC14: Auth Required - PASS/FAIL

Notes:
_________________________________
_________________________________
_________________________________
```
