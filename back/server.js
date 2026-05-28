"use strict";

require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const rateLimit  = require("express-rate-limit");
const apiRoutes  = require("./routes/api");

const app  = express();
const PORT = Number(process.env.PORT) || 4000;

/* ── CORS ── */
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(cors({
  origin(origin, cb) {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

/* ── Rate limiting ── */
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests — slow down." },
  }),
);

/* ── Routes ── */
app.use("/api", apiRoutes);

/* ── 404 catch-all ── */
app.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});

/* ── Global error handler ── */
app.use((err, _req, res, _next) => {
  console.error("[error]", err.message);
  // Multer errors (file size, mime type)
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large. Maximum is 500 MB." });
  }
  res.status(500).json({ error: err.message || "Internal server error." });
});

/* ── Start (only when run directly — not in Vercel serverless) ── */
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`\n🔷  Hashmark backend running on http://localhost:${PORT}`);
    console.log(`     Health : GET  http://localhost:${PORT}/api/health`);
    console.log(`     Hash   : POST http://localhost:${PORT}/api/hash/file`);
    console.log(`     Auth   : POST http://localhost:${PORT}/api/authenticate`);
    console.log(`     Verify : GET  http://localhost:${PORT}/api/verify/:hash`);
    console.log(`     Info   : GET  http://localhost:${PORT}/api/info\n`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌  Port ${PORT} is already in use.`);
      console.error(`   Run this to free it:  kill $(fuser ${PORT}/tcp)\n`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}

module.exports = app;
