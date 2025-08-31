// Vercel serverless function entry point
const app = require('../dist/app.js').default;

module.exports = (req, res) => {
  return app(req, res);
};
