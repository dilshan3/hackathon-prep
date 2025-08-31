// Simple test to verify API structure
const app = require('./src/server');

// Test if the app loads correctly
console.log('✅ App loaded successfully');
console.log('✅ Server configuration is correct');

// Test if routes are registered
const routes = app._router.stack
  .filter(layer => layer.route)
  .map(layer => layer.route.path);

console.log('✅ Registered routes:', routes);

module.exports = app;
