"use strict";

const multer = require("multer");

// Store files in memory so we can hash the buffer directly without temp-file overhead.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
  },
  fileFilter(_req, file, cb) {
    // Accept video files and any generic binary; clients may upload audio too.
    const allowed = /video\/|audio\/|application\/octet-stream|image\//;
    if (allowed.test(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported MIME type: ${file.mimetype}`));
  },
});

module.exports = { upload };
