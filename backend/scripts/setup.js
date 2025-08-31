#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Logistics API Backend...\n');

// Check if .env exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  Creating .env file from example...');
  const examplePath = path.join(__dirname, '..', 'env.example');
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log('✅ .env file created. Please update it with your configuration.\n');
  }
}

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  
  console.log('\n🔧 Generating Prisma client...');
  execSync('npm run db:generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  
  console.log('\n🏗️  Building TypeScript...');
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  
  console.log('\n✅ Setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Update your .env file with database credentials');
  console.log('2. Run: npm run db:push (for development)');
  console.log('3. Run: npm run dev (to start development server)');
  
} catch (error) {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
}
