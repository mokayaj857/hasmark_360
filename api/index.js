// Vercel serverless entry — CommonJS (.cjs) so it can require() the Express app
// Vercel routes /api/* here; the Express app handles all sub-paths internally.
const app = require("../back/server.js");
module.exports = app;
