// Vercel serverless entry point — routes all /api/* requests to the Express app
const { app } = require('../server/app');
module.exports = app;
