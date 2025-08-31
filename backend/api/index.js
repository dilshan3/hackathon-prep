const serverless = require('serverless-http');
const app = require('../src/server');

// Export the serverless handler
module.exports = serverless(app, {
  binary: false
});
