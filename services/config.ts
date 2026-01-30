// API Configuration
// Update this based on your environment

// Detect platform and set appropriate API URL
export const getApiUrl = () => {
  // For development, change this to your backend URL
  const BACKEND_URL = 'http://192.168.210.122:5000';
  
  // Uncomment the appropriate line based on your testing environment:
  
  // For iOS Simulator (default):
  return `${BACKEND_URL}/api`;
  
  // For Android Emulator:
  // return 'http://10.0.2.2:5000/api/auth';
  
  // For Physical Device (replace with your computer's IP):
  // return 'http://192.168.x.x:5000/api/auth';
  
  // For Web:
  // return 'http://localhost:5000/api/auth';
};

// How to find your IP address:
// Mac/Linux: Run in terminal: ifconfig | grep "inet " | grep -v 127.0.0.1
// Windows: Run in terminal: ipconfig
// Look for IPv4 Address (something like 192.168.x.x)
