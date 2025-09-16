// Quick Test Script - Verify everything is working
const fs = require('fs');
const path = require('path');

console.log('🔍 Smart Shift Tracker - Quick Diagnostic\n');

// Check project structure
const requiredFiles = [
    'package.json',
    'src/App.tsx',
    'src/main.tsx',
    '.env'
];

console.log('📁 Checking project files:');
requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Check package.json
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log('\n📦 Project info:');
    console.log(`   Name: ${packageJson.name}`);
    console.log(`   Version: ${packageJson.version}`);
    console.log(`   Scripts: ${Object.keys(packageJson.scripts).join(', ')}`);
} catch (error) {
    console.log('❌ Could not read package.json');
}

// Check environment file
try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL');
    const hasSupabaseKey = envContent.includes('VITE_SUPABASE_ANON_KEY');
    
    console.log('\n🔐 Environment configuration:');
    console.log(`   Supabase URL: ${hasSupabaseUrl ? '✅' : '❌'}`);
    console.log(`   Supabase Key: ${hasSupabaseKey ? '✅' : '❌'}`);
} catch (error) {
    console.log('❌ Could not read .env file');
}

// Check node_modules
const nodeModulesExists = fs.existsSync('node_modules');
console.log(`\n📚 Dependencies: ${nodeModulesExists ? '✅ Installed' : '❌ Not installed'}`);

console.log('\n🚀 Ready to start!');
console.log('Run: npm run dev');
console.log('Or double-click: start-app.bat');

if (!nodeModulesExists) {
    console.log('\n⚠️  Run "npm install" first!');
}