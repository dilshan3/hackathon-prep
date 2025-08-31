# GitHub Actions Workflow Troubleshooting

## 🚨 Common Issues & Solutions

### 1. Workflow Not Triggering

#### **Issue**: Workflow doesn't run when you push code

**Possible Causes & Solutions:**

#### A. Branch Name Mismatch
**Problem**: Your workflow is configured for `main` and `develop` branches, but you're pushing to a different branch.

**Solution**: 
- Check your current branch: `git branch`
- Either push to the correct branch or update the workflow:

```yaml
# In .github/workflows/deploy.yml
on:
  push:
    branches: [ main, develop, your-branch-name ]
  pull_request:
    branches: [ main, develop, your-branch-name ]
```

#### B. File Path Issues
**Problem**: Workflow files are not in the correct location.

**Solution**: Ensure your workflow files are in the exact path:
```
your-repo/
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       ├── migrate.yml
│       └── test-api.yml
└── backend/
    └── (your backend files)
```

#### C. YAML Syntax Errors
**Problem**: Invalid YAML syntax prevents workflows from loading.

**Solution**: 
- Use a YAML validator (like [YAML Lint](http://www.yamllint.com/))
- Check GitHub Actions tab for syntax error messages

### 2. Workflow Fails During Execution

#### **Issue**: Workflow starts but fails with errors

#### A. Missing Dependencies
**Problem**: `npm ci` fails because `package-lock.json` is missing.

**Solution**:
```bash
# In your backend directory
npm install
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

#### B. Environment Variables Missing
**Problem**: Workflow fails because environment variables are not set.

**Solution**: Check that all required secrets are set in GitHub:
- Go to your repo → Settings → Secrets and variables → Actions
- Verify these secrets exist:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `VERCEL_URL`

#### C. Database Connection Issues
**Problem**: PostgreSQL service container fails to start.

**Solution**: The workflow uses a PostgreSQL service container. If it fails:
1. Check the workflow logs for specific error messages
2. Ensure the database service configuration is correct
3. Try running locally first to verify your code works

### 3. Deployment Issues

#### **Issue**: Vercel deployment fails

#### A. Invalid Vercel Token
**Problem**: `Error: Invalid token`

**Solution**:
1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Create a new token
3. Update the `VERCEL_TOKEN` secret in GitHub

#### B. Wrong Project/Org ID
**Problem**: `Error: Project not found`

**Solution**:
1. Get correct IDs:
   ```bash
   vercel project ls
   vercel whoami
   ```
2. Update GitHub secrets:
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

### 4. Debugging Steps

#### Step 1: Check Workflow Status
1. Go to your GitHub repository
2. Click "Actions" tab
3. Look for your workflow runs
4. Check if workflows are listed at all

#### Step 2: Verify File Structure
```bash
# Check if workflow files exist
ls -la .github/workflows/

# Should show:
# deploy.yml
# migrate.yml
# test-api.yml
```

#### Step 3: Test Locally
```bash
# Test your build process locally
cd backend
npm install
npm run build
```

#### Step 4: Check Branch and Push
```bash
# Verify your current branch
git branch

# Make sure you're on the right branch
git checkout main  # or develop

# Push to trigger workflow
git add .
git commit -m "Test workflow trigger"
git push origin main
```

### 5. Quick Fixes

#### Fix 1: Update Branch Configuration
If you're using a different branch name, update all workflow files:

```yaml
# In all .github/workflows/*.yml files
on:
  push:
    branches: [ main, develop, your-branch-name ]
  pull_request:
    branches: [ main, develop, your-branch-name ]
```

#### Fix 2: Simplify for Testing
Create a simple test workflow to verify GitHub Actions works:

```yaml
# .github/workflows/test.yml
name: Test Workflow

on:
  push:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v4
    - name: Test
      run: echo "Workflow is working!"
```

#### Fix 3: Check Repository Settings
1. Go to your repo → Settings → Actions → General
2. Ensure "Allow all actions and reusable workflows" is selected
3. Check that workflows are enabled

### 6. Common Error Messages

| Error | Solution |
|-------|----------|
| `Workflow not found` | Check file path and YAML syntax |
| `Branch not found` | Update branch names in workflow |
| `Invalid token` | Regenerate Vercel token |
| `Project not found` | Check Vercel project/org IDs |
| `Permission denied` | Check repository settings |
| `Package not found` | Run `npm install` locally first |

### 7. Testing Your Fix

After making changes:

1. **Commit and push**:
   ```bash
   git add .
   git commit -m "Fix workflow configuration"
   git push origin main
   ```

2. **Check Actions tab**:
   - Go to your repo → Actions
   - Look for the workflow run
   - Check the logs for any errors

3. **Verify deployment**:
   - If deployment succeeds, check your Vercel dashboard
   - Test your API endpoints

### 8. Still Not Working?

If none of the above solutions work:

1. **Check GitHub Status**: Visit [GitHub Status](https://www.githubstatus.com/)
2. **Review Logs**: Look at the detailed workflow logs
3. **Simplify**: Start with a basic workflow and add complexity gradually
4. **Permissions**: Ensure your GitHub account has proper permissions

---

## 🆘 Need More Help?

1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review the [Vercel GitHub Actions guide](https://vercel.com/docs/deployments/git/github)
3. Look at the workflow logs for specific error messages
4. Test your setup step by step

Remember: GitHub Actions can take a few minutes to show up after pushing code, so be patient! 🕐
