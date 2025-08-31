// Root-level Vercel serverless function entry point
const path = require('path');

// Import the compiled app from backend
const app = require('../backend/dist/app.js').default;

module.exports = (req, res) => {
  return app(req, res);
};
