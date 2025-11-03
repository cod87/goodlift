# GitHub Pages Deployment Guide

This guide will help you deploy the GoodLift app to GitHub Pages from the `main/docs` directory.

## Prerequisites

- The `docs/` directory is already built and committed to the repository
- You have admin access to the GitHub repository

## One-Time GitHub Pages Setup

Follow these steps to configure GitHub Pages for your repository:

1. **Navigate to Repository Settings**
   - Go to your GitHub repository: https://github.com/cod87/goodlift
   - Click on the **Settings** tab (⚙️)

2. **Access Pages Settings**
   - In the left sidebar, scroll down and click on **Pages** (under "Code and automation")

3. **Configure Source**
   - Under **"Build and deployment"** section:
     - **Source**: Select **"Deploy from a branch"**
   
4. **Select Branch and Directory**
   - Under **"Branch"** section:
     - Select **`main`** from the first dropdown
     - Select **`/docs`** from the second dropdown
     - Click **Save**

5. **Wait for Deployment**
   - GitHub will automatically deploy your site
   - This usually takes 1-3 minutes
   - You'll see a green checkmark when deployment is successful

6. **Access Your Site**
   - Your site will be available at: **https://cod87.github.io/goodlift/**
   - The URL will be displayed at the top of the Pages settings page

## Deploying Updates

After making code changes:

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Commit the changes**
   ```bash
   git add docs/
   git commit -m "Update deployment build"
   ```

3. **Push to GitHub**
   ```bash
   git push origin main
   ```

4. **Wait for deployment**
   - GitHub Pages will automatically detect the changes
   - Your site will be updated within 1-3 minutes

## Verification

After deployment, verify your site works correctly:

1. Visit https://cod87.github.io/goodlift/
2. Check that:
   - The page loads without errors
   - All CSS styles are applied correctly
   - Exercise data loads properly
   - Workout generation works
   - All features function as expected

## Troubleshooting

### Assets Not Loading (404 errors)

If you see 404 errors for CSS/JS files:
- Check that `vite.config.js` has `base: '/goodlift/'`
- Rebuild: `npm run build`
- Commit and push the `docs/` directory

### Page Shows 404

If the entire page shows 404:
- Verify GitHub Pages settings (Settings → Pages)
- Ensure "Branch" is set to `main` and directory is `/docs`
- Check that `docs/index.html` exists in your repository

### Changes Not Appearing

If your changes aren't visible:
- Wait 2-3 minutes for GitHub Pages to rebuild
- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check the GitHub Pages deployment status in repository Actions tab

### Clear Browser Cache

If issues persist:
1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

## Alternative: GitHub Actions Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) as an alternative deployment method. However, when using the main/docs approach, this workflow should be disabled to avoid conflicts.

To disable the workflow:
1. Rename or delete `.github/workflows/deploy.yml`
2. Or keep it but don't enable "GitHub Actions" as the Pages source

## Important Files

- `vite.config.js` - Configures build output to `docs/` with base path `/goodlift/`
- `docs/.nojekyll` - Prevents GitHub Pages from using Jekyll processing
- `.gitignore` - Configured to allow `docs/` to be committed
- `eslint.config.js` - Configured to skip linting built files in `docs/`

## Notes

- The `docs/` directory should be committed to version control
- Always build before committing and pushing
- The `.nojekyll` file is automatically created during build
- GitHub Pages serves files from the `docs/` directory on the `main` branch
