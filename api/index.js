// Root-level Vercel serverless function entry point
const path = require('path');

// Import the compiled app from backend
const app = require('../backend/dist/app.js').default;

module.exports = (req, res) => {
  try {
    return app(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};
