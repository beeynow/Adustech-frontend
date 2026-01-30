// Run this with: node diagnostics.js
// This will help identify connection issues

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

console.log('🔧 Running Diagnostics...\n');
console.log('Testing API URL:', API_URL);
console.log('');

async function testRegistration() {
  try {
    console.log('📤 Testing registration endpoint...');
    const response = await axios.post(`${API_URL}/register`, {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    
    console.log('✅ Registration successful!');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Registration failed!');
    if (error.code === 'ECONNREFUSED') {
      console.error('   → Backend not running on port 5000');
      console.error('   → Start backend: cd backend && node app.js');
    } else if (error.response) {
      console.error('   → Status:', error.response.status);
      console.error('   → Message:', error.response.data);
    } else {
      console.error('   → Error:', error.message);
    }
    return false;
  }
}

async function runTests() {
  console.log('==========================================');
  console.log('  ADUSTECH API DIAGNOSTICS');
  console.log('==========================================\n');
  
  const success = await testRegistration();
  
  console.log('\n==========================================');
  if (success) {
    console.log('✅ All tests passed!');
    console.log('\nYour backend is working correctly.');
    console.log('If frontend still fails, check:');
    console.log('1. API URL in adustech/services/config.ts');
    console.log('2. Device/emulator network connection');
    console.log('3. Console logs when registering');
  } else {
    console.log('❌ Tests failed!');
    console.log('\nTroubleshooting steps:');
    console.log('1. Check backend is running: cd backend && node app.js');
    console.log('2. Check MongoDB is connected');
    console.log('3. Check port 5000 is available');
  }
  console.log('==========================================\n');
}

runTests();
