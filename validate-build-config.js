#!/usr/bin/env node
/**
 * Adustech Tech - Build Configuration Validator
 * Run this script before building to ensure everything is ready
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Adustech Tech Build Configuration...\n');

let errors = [];
let warnings = [];
let checks = 0;

// Check 1: app.json exists and has correct structure
try {
  const appJson = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
  checks++;
  
  if (appJson.expo.name !== 'Adustech Tech') {
    errors.push('❌ App name should be "Adustech Tech"');
  } else {
    console.log('✅ App name: Adustech Tech');
  }
  
  if (appJson.expo.version !== '1.0.0') {
    warnings.push('⚠️  Version is not 1.0.0');
  } else {
    console.log('✅ Version: 1.0.0');
  }
  
  if (!appJson.expo.ios?.bundleIdentifier) {
    errors.push('❌ iOS bundle identifier missing');
  } else {
    console.log(`✅ iOS Bundle ID: ${appJson.expo.ios.bundleIdentifier}`);
  }
  
  if (!appJson.expo.android?.package) {
    errors.push('❌ Android package name missing');
  } else {
    console.log(`✅ Android Package: ${appJson.expo.android.package}`);
  }
  
  if (!appJson.expo.extra?.eas?.projectId) {
    warnings.push('⚠️  EAS project ID not set (run "eas init")');
  } else {
    console.log(`✅ EAS Project ID configured`);
  }
  
} catch (e) {
  errors.push('❌ app.json not found or invalid');
}

// Check 2: eas.json exists
checks++;
if (fs.existsSync('./eas.json')) {
  console.log('✅ eas.json configured');
  try {
    const easJson = JSON.parse(fs.readFileSync('./eas.json', 'utf8'));
    if (easJson.build?.production) {
      console.log('✅ Production build profile ready');
    }
  } catch (e) {
    errors.push('❌ eas.json is invalid');
  }
} else {
  errors.push('❌ eas.json not found');
}

// Check 3: Icon exists
checks++;
if (fs.existsSync('./assets/images/icon.png')) {
  const stats = fs.statSync('./assets/images/icon.png');
  console.log(`✅ App icon exists (${(stats.size / 1024).toFixed(0)}KB)`);
} else {
  errors.push('❌ App icon not found at assets/images/icon.png');
}

// Check 4: Package.json
checks++;
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  if (packageJson.name === 'adustech-tech') {
    console.log('✅ Package name: adustech-tech');
  }
  
  // Check for required dependencies
  const requiredDeps = [
    'expo',
    'expo-router',
    'react-native-toast-message',
    '@react-native-picker/picker'
  ];
  
  let missingDeps = [];
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep]) {
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length > 0) {
    errors.push(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
  } else {
    console.log('✅ All required dependencies installed');
  }
  
} catch (e) {
  errors.push('❌ package.json not found or invalid');
}

// Check 5: Config file for API
checks++;
if (fs.existsSync('./services/config.ts')) {
  const config = fs.readFileSync('./services/config.ts', 'utf8');
  if (config.includes('localhost')) {
    warnings.push('⚠️  API URL still pointing to localhost - update for production!');
  } else {
    console.log('✅ API configuration ready');
  }
} else {
  warnings.push('⚠️  config.ts not found');
}

// Check 6: Toast utility
checks++;
if (fs.existsSync('./utils/toast.ts')) {
  console.log('✅ Toast utility configured');
} else {
  warnings.push('⚠️  Toast utility not found');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log(`\n📊 Validation Summary:`);
console.log(`   Total Checks: ${checks}`);
console.log(`   Errors: ${errors.length}`);
console.log(`   Warnings: ${warnings.length}\n`);

if (errors.length > 0) {
  console.log('❌ ERRORS FOUND:\n');
  errors.forEach(err => console.log(`   ${err}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  warnings.forEach(warn => console.log(`   ${warn}`));
  console.log('');
}

if (errors.length === 0) {
  console.log('🎉 BUILD CONFIGURATION IS READY!\n');
  console.log('Next steps:');
  console.log('   1. eas login');
  console.log('   2. eas init');
  console.log('   3. eas build --platform android --profile production\n');
  process.exit(0);
} else {
  console.log('❌ Please fix the errors above before building.\n');
  process.exit(1);
}
