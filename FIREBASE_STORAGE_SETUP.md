# Firebase Storage Setup for GoodLift

## Quick Start

If you're experiencing avatar upload failures, follow these steps:

1. **Enable Firebase Storage**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project (goodlift-7760a)
   - Navigate to Storage in the left sidebar
   - Click "Get Started" if Storage is not enabled

2. **Deploy Security Rules**
   - In Firebase Console > Storage > Rules tab
   - Copy and paste the security rules from this document (see below)
   - Click "Publish"

3. **Test Upload**
   - Sign in to the app (not as guest)
   - Go to Profile screen
   - Click on your avatar
   - Select "Upload Custom" tab
   - Choose an image and verify it uploads successfully

## Overview
GoodLift uses Firebase Storage to store user avatar images. This document explains the configuration and security rules needed for avatar uploads to work properly.

## Firebase Storage Configuration

### Required Setup
1. Enable Firebase Storage in your Firebase Console
2. Configure security rules (see below)
3. Ensure CORS is properly configured for your domain

### Storage Structure

User avatars are stored in the following structure:
```
avatars/{userId}/avatar.jpg
```

Where:
- `{userId}` is the Firebase Authentication UID of the user
- Each user can only have one avatar file (overwrites on new uploads)
- Images are compressed to 200x200px JPEG format before upload

## Firebase Storage Security Rules

To ensure users can only upload and access their own avatars, configure your Firebase Storage security rules as follows:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Avatar uploads - users can only upload/read their own avatars
    match /avatars/{userId}/{allPaths=**} {
      // Allow read if authenticated user matches userId OR allow public read
      // (Change to require auth for private avatars)
      allow read: if true;  // Public read - change to: request.auth != null && request.auth.uid == userId
      
      // Allow write only if:
      // 1. User is authenticated
      // 2. User ID matches the path
      // 3. File is an image
      // 4. File is under 5MB
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.contentType.matches('image/.*')
                   && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

### Security Features

1. **User Isolation**: Each user can only upload to their own folder
2. **Authentication Required**: Uploads require authentication
3. **File Type Validation**: Only image files are allowed
4. **Size Limit**: Maximum 5MB file size
5. **Public Read (Optional)**: Avatars are readable by anyone - change if you want private avatars

### Alternative: Private Avatars

If you want avatars to be private (only visible to the owner):

```javascript
allow read: if request.auth != null && request.auth.uid == userId;
```

## Supported Image Formats

The app supports the following image formats:
- JPEG/JPG
- PNG
- WebP

Files are automatically:
- Validated before upload
- Compressed to 200x200px
- Converted to JPEG format
- Cropped to square aspect ratio

## Error Handling

The app provides user-friendly error messages for common scenarios:

1. **Authentication Errors**
   - User not signed in
   - Invalid authentication token
   
2. **Permission Errors**
   - Security rules denying access
   - Attempting to upload to another user's folder

3. **Storage Errors**
   - Storage quota exceeded
   - Network connectivity issues
   - CORS configuration problems

4. **File Validation Errors**
   - Invalid file type
   - File size exceeds 5MB
   - Corrupted image file

## Testing Avatar Upload

To test if avatar uploads are working:

1. **Check Firebase Console**
   - Go to Firebase Console > Storage
   - Ensure Storage is enabled
   - Verify security rules are deployed

2. **Test Upload Flow**
   - Sign in as a real user (not guest)
   - Go to Profile screen
   - Click on avatar
   - Select "Upload Custom" tab
   - Choose an image (JPEG/PNG/WebP, < 5MB)
   - Verify upload succeeds and preview shows

3. **Verify Storage**
   - Check Firebase Console > Storage
   - Look for `avatars/{userId}/avatar.jpg`
   - Verify file appears with correct size

## Common Issues and Solutions

### Issue: "Permission denied" error
**Solution**: Check Firebase Storage security rules are deployed correctly

### Issue: "Storage not configured" error
**Solution**: Ensure Firebase Storage is enabled in Firebase Console

### Issue: "Network error" or CORS error
**Solution**: 
- Check internet connection
- Verify Firebase Storage CORS configuration
- Ensure storage bucket URL is correct in firebase.js

### Issue: "Authentication required" error
**Solution**: 
- User must be signed in (not guest mode)
- Check Firebase Auth is working
- Verify currentUser.uid is available

### Issue: Upload works but image doesn't display
**Solution**:
- Check security rules allow read access
- Verify download URL is being saved to user profile
- Check browser console for CORS errors

## Deployment Checklist

Before deploying to production, ensure:

- [ ] Firebase Storage is enabled in Firebase Console
- [ ] Security rules are deployed and tested
- [ ] Test avatar upload works for authenticated users
- [ ] Test that guest users see appropriate error message
- [ ] Verify uploaded avatars display correctly in profile
- [ ] Test with various image formats (JPEG, PNG, WebP)
- [ ] Test file size validation (reject files > 5MB)
- [ ] Test invalid file type rejection
- [ ] Verify error messages are user-friendly and actionable

## Benefits

- **Personalization**: Users can upload custom profile pictures
- **Security**: Each user can only access their own avatars
- **Optimization**: Images are automatically compressed and optimized
- **Reliability**: Comprehensive error handling guides users through issues
