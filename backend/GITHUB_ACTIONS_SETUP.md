# GitHub Actions + Vercel Deployment Setup

This guide will help you set up automated deployment to Vercel using GitHub Actions.

## 🚀 Overview

The GitHub Actions workflows will:
1. **Test** your code on every push/PR
2. **Deploy** to Vercel on main/master branch
3. **Test API** endpoints after deployment
4. **Migrate database** when needed

## 📋 Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **Vercel Account**: You need a Vercel account
3. **Neon Database**: PostgreSQL database for production

## 🔧 Step-by-Step Setup

### 1. Create Vercel Project

First, create a new project on Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Initialize project (run this in the backend directory)
cd backend
vercel

# Follow the prompts:
# - Set up and deploy: Yes
# - Which scope: Select your account
# - Link to existing project: No
# - Project name: delivery-tracker-backend (or your preferred name)
# - Directory: ./
# - Override settings: No
```

### 2. Get Vercel Configuration

After creating the project, you'll need these values:

```bash
# Get your project ID
vercel project ls

# Get your org ID
vercel whoami
```

### 3. Create Vercel Token

1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name it: `github-actions-deploy`
4. Copy the token (you'll need it for GitHub secrets)

### 4. Set Up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Description | Value |
|-------------|-------------|-------|
| `VERCEL_TOKEN` | Vercel API token | Your Vercel token from step 3 |
| `VERCEL_ORG_ID` | Vercel organization ID | From `vercel whoami` |
| `VERCEL_PROJECT_ID` | Vercel project ID | From `vercel project ls` |
| `DATABASE_URL` | Production database URL | Your Neon connection string |
| `JWT_SECRET` | JWT signing secret | Strong secret (32+ characters) |
| `VERCEL_URL` | Your Vercel deployment URL | `https://your-project.vercel.app` |

### 5. Configure Vercel Environment Variables

In your Vercel dashboard:

1. Go to your project
2. Settings → Environment Variables
3. Add these variables:

```
DATABASE_URL = your-neon-connection-string
JWT_SECRET = your-jwt-secret
NODE_ENV = production
```

### 6. Push Code to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit with GitHub Actions"

# Push to GitHub
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

## 🔄 Workflow Files

The following workflow files are included:

### 1. `.github/workflows/deploy.yml`
- **Triggers**: Push to main/master, Pull requests
- **Jobs**:
  - **Test**: Runs tests with PostgreSQL service
  - **Deploy**: Deploys to Vercel (only on main/master)

### 2. `.github/workflows/migrate.yml`
- **Triggers**: Manual dispatch
- **Purpose**: Run database migrations
- **Usage**: Go to Actions tab → Database Migration → Run workflow

### 3. `.github/workflows/test-api.yml`
- **Triggers**: After successful deployment
- **Purpose**: Test API endpoints after deployment

## 🧪 Testing the Setup

### 1. Test the Workflow

1. Make a small change to your code
2. Push to a feature branch
3. Create a pull request to main
4. Check the Actions tab to see the workflow run

### 2. Test Deployment

1. Merge the PR to main
2. Check the Actions tab for deployment
3. Visit your Vercel URL to verify deployment

### 3. Test API Endpoints

After deployment, the API testing workflow will automatically run:

```bash
# Test health endpoint
curl https://your-project.vercel.app/health

# Test registration
curl -X POST https://your-project.vercel.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User"
  }'
```

## 🔧 Manual Database Migration

If you need to run database migrations manually:

1. Go to GitHub repository → Actions
2. Click "Database Migration"
3. Click "Run workflow"
4. Select environment (production/staging)
5. Click "Run workflow"

## 🚨 Troubleshooting

### Common Issues

#### 1. Vercel Token Issues
```
Error: Invalid token
```
**Solution**: Regenerate your Vercel token and update the GitHub secret.

#### 2. Database Connection Issues
```
Error: Connection to database failed
```
**Solution**: 
- Check your `DATABASE_URL` secret
- Ensure Neon database is accessible
- Verify SSL settings in connection string

#### 3. Build Failures
```
Error: Build failed
```
**Solution**:
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Check for syntax errors in your code

#### 4. Environment Variables Missing
```
Error: JWT_SECRET is not defined
```
**Solution**: Add all required environment variables to Vercel dashboard.

### Debugging Steps

1. **Check Workflow Logs**: Go to Actions tab → Click on failed workflow → Check logs
2. **Test Locally**: Run `npm run build` locally to catch build issues
3. **Check Vercel Logs**: Go to Vercel dashboard → Functions → Check function logs
4. **Verify Secrets**: Double-check all GitHub secrets are set correctly

## 📈 Monitoring

### GitHub Actions
- Go to Actions tab to monitor workflow runs
- Set up notifications for failed deployments

### Vercel Dashboard
- Monitor function performance
- Check error logs
- View deployment history

### Database
- Monitor Neon dashboard for connection issues
- Check query performance

## 🔒 Security Best Practices

1. **Secrets Management**: Never commit secrets to code
2. **Token Rotation**: Regularly rotate Vercel tokens
3. **Environment Separation**: Use different databases for staging/production
4. **Access Control**: Limit who can trigger deployments

## 📝 Next Steps

After setup is complete:

1. **Add Tests**: Create unit and integration tests
2. **Set Up Monitoring**: Add error tracking (Sentry, etc.)
3. **Performance Monitoring**: Set up Vercel Analytics
4. **Backup Strategy**: Set up database backups
5. **Documentation**: Keep deployment docs updated

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Check Vercel function logs
4. Verify all secrets and environment variables
5. Test locally to isolate issues

---

## 📋 Checklist

- [ ] Vercel project created
- [ ] Vercel token generated
- [ ] GitHub secrets configured
- [ ] Vercel environment variables set
- [ ] Code pushed to GitHub
- [ ] First deployment successful
- [ ] API endpoints tested
- [ ] Database migration tested
- [ ] Monitoring set up

Your automated deployment pipeline is now ready! 🎉
