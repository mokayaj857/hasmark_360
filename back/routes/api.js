"use strict";

const express  = require("express");
const crypto   = require("crypto");
const fs       = require("fs");
const http     = require("http");
const https    = require("https");
const path     = require("path");
const QRCode   = require("qrcode");
const PDFDoc   = require("pdfkit");
const { ethers } = require("ethers");
const { upload }           = require("../middleware/upload");
const { getContractSetup } = require("../config/contract");

const router = express.Router();

const DATA360_BASE_URL = (process.env.DATA360_BASE_URL || "https://data360api.worldbank.org").replace(/\/$/, "");
const DATA360_API_KEY = (process.env.DATA360_API_KEY || "").trim();
const DATA360_API_KEY_PARAM = (process.env.DATA360_API_KEY_PARAM || "api_key").trim() || "api_key";
const PASSPORT_DIR = path.join(__dirname, "../cache/passports");
const HASH_RE = /^[a-f0-9]{64}$/i;

function stableStringify(value) {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function buildData360Url(pathname, params = {}, includeKey = true) {
  const url = new URL(`${DATA360_BASE_URL}/${pathname.replace(/^\//, "")}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  if (DATA360_BASE_URL.includes("api.worldbank.org") && !url.searchParams.has("format")) {
    url.searchParams.set("format", "json");
  }
  if (includeKey && DATA360_API_KEY) {
    url.searchParams.set(DATA360_API_KEY_PARAM, DATA360_API_KEY);
  }
  return url.toString();
}

function requestJson(url, { method = "GET", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === "https:" ? https : http;
    const payload = body ? (typeof body === "string" ? body : JSON.stringify(body)) : null;
    const req = client.request(parsed, {
      method,
      headers: {
        Accept: "application/json",
        ...(payload ? { "Content-Type": "application/json" } : {}),
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        ...headers,
      },
    }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        let parsedBody = null;
        if (body) {
          try {
            parsedBody = JSON.parse(body);
          } catch (err) {
            return reject(new Error(`Data360 response parse failed: ${err.message}`));
          }
        }
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          const message = parsedBody?.error || parsedBody?.title || `Data360 request failed (${res.statusCode || "unknown"}).`;
          return reject(new Error(message));
        }
        resolve(parsedBody);
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error("Data360 request timed out."));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

async function fetchData360(pathname, params) {
  const url = buildData360Url(pathname, params, true);
  return requestJson(url);
}

async function postData360(pathname, payload) {
  const url = buildData360Url(pathname, {}, true);
  return requestJson(url, { method: "POST", body: payload });
}

async function ensurePassportDir() {
  await fs.promises.mkdir(PASSPORT_DIR, { recursive: true });
}

async function savePassport(hash, passport) {
  await ensurePassportDir();
  const filePath = path.join(PASSPORT_DIR, `${hash}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(passport, null, 2), "utf8");
}

async function loadPassport(hash) {
  const filePath = path.join(PASSPORT_DIR, `${hash}.json`);
  try {
    const raw = await fs.promises.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

function parseDateRange(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{4})(?::(\d{4}))?$/);
  if (!match) throw new Error("Date must be YYYY or YYYY:YYYY.");
  const start = Number(match[1]);
  const end = Number(match[2] || match[1]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    throw new Error("Date range is invalid.");
  }
  return { start, end, label: match[2] ? `${start}:${end}` : `${start}` };
}

function parseData360IndicatorId(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) return null;
  const parts = normalized.split("_");
  if (parts.length < 3) return null;
  return { indicatorId: normalized, databaseId: `${parts[0]}_${parts[1]}` };
}

function createHttpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function resolveData360Indicator(value) {
  const normalized = String(value || "").trim();
  const direct = parseData360IndicatorId(normalized);
  if (direct) {
    return { ...direct, name: "", unit: "", refCountries: [] };
  }

  const search = await postData360("data360/searchv2", { search: normalized, top: 8 });
  const results = Array.isArray(search?.value) ? search.value : [];
  if (!results.length) {
    throw new Error("No Data360 indicators matched that query. Use a Data360 indicator ID like WB_HNP_SP_POP_TOTL.");
  }

  const codeLike = /^[A-Za-z0-9._-]+$/.test(normalized) && !/\s/.test(normalized);
  const normalizedUpper = normalized.toUpperCase();
  let match = results.find((item) => {
    const sd = item?.series_description || {};
    if (typeof sd.idno === "string" && sd.idno.toUpperCase() === normalizedUpper) return true;
    const alternates = Array.isArray(sd.alternate_identifiers) ? sd.alternate_identifiers : [];
    return alternates.some((alt) => String(alt?.identifier || "").toUpperCase() === normalizedUpper);
  });

  if (!match && !codeLike) match = results[0];
  if (!match) {
    throw new Error("No Data360 indicator matched that code. Use a Data360 indicator ID like WB_HNP_SP_POP_TOTL.");
  }

  const sd = match.series_description || {};
  const indicatorId = (sd.idno || normalized).toUpperCase();
  const databaseId = sd.database_id || parseData360IndicatorId(indicatorId)?.databaseId || "";
  if (!databaseId) {
    throw new Error("Data360 database ID is missing for this indicator.");
  }
  const refCountries = Array.isArray(sd.ref_country) ? sd.ref_country : [];
  return {
    indicatorId,
    databaseId,
    name: sd.name || "",
    unit: sd.measurement_unit || "",
    refCountries,
  };
}

async function buildData360Passport({ indicator, country, date, limit, database, issuedAt }) {
  if (typeof indicator !== "string" || !indicator.trim()) {
    throw createHttpError(400, "Body must include a non-empty 'indicator' string.");
  }
  if (typeof country !== "string" || !country.trim()) {
    throw createHttpError(400, "Body must include a non-empty 'country' string.");
  }

  const indicatorInput = indicator.trim();
  const countryId = country.trim().toUpperCase();
  const dateRange = typeof date === "string" ? date.trim() : "";
  const databaseInput = typeof database === "string" ? database.trim().toUpperCase() : "";

  if (!/^[A-Za-z0-9._-]+$/.test(indicatorInput)) {
    throw createHttpError(400, "Indicator contains invalid characters.");
  }
  if (!/^[A-Za-z0-9;,_-]+$/.test(countryId)) {
    throw createHttpError(400, "Country contains invalid characters.");
  }
  if (databaseInput && !/^[A-Za-z0-9_]+$/.test(databaseInput)) {
    throw createHttpError(400, "Database contains invalid characters.");
  }

  let dateInfo = null;
  if (dateRange) {
    try {
      dateInfo = parseDateRange(dateRange);
    } catch (err) {
      throw createHttpError(400, err.message);
    }
  }

  let resolved;
  try {
    resolved = await resolveData360Indicator(indicatorInput);
  } catch (err) {
    throw createHttpError(404, err.message);
  }

  const indicatorId = resolved.indicatorId;
  const databaseId = databaseInput || resolved.databaseId;
  if (!databaseId) {
    throw createHttpError(400, "Data360 database ID is required for this indicator.");
  }

  const perPage = Math.min(Math.max(Number(limit) || 12, 1), 100);
  const refCountries = Array.isArray(resolved.refCountries) ? resolved.refCountries : [];
  const countryMeta = refCountries.find((entry) => String(entry?.code || "").toUpperCase() === countryId);
  const countryName = countryMeta?.name || "";

  const fetchTop = Math.min(Math.max(Math.max(perPage, 120), 1), 1000);
  const params = {
    top: fetchTop,
    skip: 0,
    DATABASE_ID: databaseId,
    INDICATOR: indicatorId,
    REF_AREA: countryId,
  };
  if (dateInfo && dateInfo.start === dateInfo.end) {
    params.TIME_PERIOD = dateInfo.start;
  }

  const response = await fetchData360("data360/data", params);
  const rows = Array.isArray(response?.value) ? response.value : [];
  if (!rows.length) {
    throw createHttpError(404, "No data returned for this indicator and country.");
  }

  let filtered = rows;
  if (dateInfo) {
    filtered = filtered.filter((row) => {
      const year = Number(row?.TIME_PERIOD);
      if (!Number.isFinite(year)) return false;
      return year >= dateInfo.start && year <= dateInfo.end;
    });
  }
  filtered.sort((a, b) => Number(b?.TIME_PERIOD) - Number(a?.TIME_PERIOD));
  const sliced = filtered.slice(0, perPage);
  if (!sliced.length) {
    throw createHttpError(404, "No data points matched the requested date range.");
  }

  const indicatorUnit = resolved.unit || sliced[0]?.UNIT_MEASURE || "";
  const points = sliced.map((row) => {
    const rawValue = row?.OBS_VALUE;
    const numeric = rawValue === null || rawValue === undefined || rawValue === ""
      ? null
      : Number(rawValue);
    const decimalRaw = row?.DECIMALS;
    const decimalValue = decimalRaw === null || decimalRaw === undefined || decimalRaw === ""
      ? null
      : Number(decimalRaw);
    return {
      date: String(row?.TIME_PERIOD ?? ""),
      value: Number.isFinite(numeric) ? numeric : null,
      unit: indicatorUnit || row?.UNIT_MEASURE || "",
      obsStatus: row?.OBS_STATUS || "",
      decimals: Number.isFinite(decimalValue) ? decimalValue : null,
    };
  });

  const publicUrl = buildData360Url("data360/data", params, false);
  let issuedAtValue = new Date().toISOString();
  if (issuedAt) {
    const parsed = Date.parse(String(issuedAt));
    if (!Number.isFinite(parsed)) {
      throw createHttpError(400, "issuedAt must be a valid ISO timestamp.");
    }
    issuedAtValue = new Date(parsed).toISOString();
  }

  const payload = {
    version: "data360-passport-v1",
    issuedAt: issuedAtValue,
    issuer: "Hashmark Protocol",
    data360: {
      apiBaseUrl: DATA360_BASE_URL,
      dataUrl: publicUrl,
      query: {
        indicator: indicatorId,
        database: databaseId,
        country: countryId,
        date: dateRange || null,
        limit: perPage,
      },
      indicator: {
        id: indicatorId,
        name: resolved.name || indicatorId,
        unit: indicatorUnit,
      },
      country: {
        id: countryId,
        name: countryName || countryId,
        iso3: countryId,
      },
      series: points,
    },
  };

  const hash = sha256Hex(stableStringify(payload));
  return {
    hash,
    passport: { ...payload, hash },
    query: payload.data360.query,
  };
}

function buildVerifyUrl(frontendUrl, hash, query, issuedAt) {
  const url = new URL(`${frontendUrl.replace(/\/$/, "")}/passport`);
  url.searchParams.set("hash", hash);
  if (issuedAt) url.searchParams.set("issuedAt", issuedAt);
  if (query?.indicator) url.searchParams.set("indicator", query.indicator);
  if (query?.database) url.searchParams.set("database", query.database);
  if (query?.country) url.searchParams.set("country", query.country);
  if (query?.date) url.searchParams.set("date", query.date);
  if (query?.limit) url.searchParams.set("limit", String(query.limit));
  return url.toString();
}

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/health
   Quick liveness check.
───────────────────────────────────────────────────────────────────────────── */
router.get("/health", (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/hash/file
   Upload a file (multipart/form-data, field name "file") and receive its
   SHA-256 hex digest.  The hash can then be passed to /api/authenticate.

   Response: { hash: string, filename: string, size: number, mimetype: string }
───────────────────────────────────────────────────────────────────────────── */
router.post("/hash/file", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Use multipart field name 'file'." });
  }

  const hash = crypto
    .createHash("sha256")
    .update(req.file.buffer)
    .digest("hex");

  res.json({
    hash,
    filename: req.file.originalname,
    size:     req.file.size,
    mimetype: req.file.mimetype,
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/hash/raw
   Hash a raw string (e.g. a hex IPFS CID or custom identifier).
   Body (JSON): { value: string }

   Response: { hash: string }
───────────────────────────────────────────────────────────────────────────── */
router.post("/hash/raw", express.json(), (req, res) => {
  const { value } = req.body || {};
  if (typeof value !== "string" || !value.trim()) {
    return res.status(400).json({ error: "Body must contain a non-empty 'value' string." });
  }

  const hash = crypto.createHash("sha256").update(value.trim()).digest("hex");
  res.json({ hash });
});

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/authenticate
   Store a video hash on-chain via the server wallet (requires PRIVATE_KEY).
   Body (JSON): { hash: string }

   If PRIVATE_KEY is not configured, returns 503 with instructions for client
   signing.

   Response: { txHash: string, blockNumber: number, creator: string, timestamp: number }
───────────────────────────────────────────────────────────────────────────── */
router.post("/authenticate", express.json(), async (req, res) => {
  const { hash } = req.body || {};
  if (typeof hash !== "string" || !hash.trim()) {
    return res.status(400).json({ error: "Body must contain a non-empty 'hash' string." });
  }

  const { contract, signer } = getContractSetup();

  if (!signer) {
    return res.status(503).json({
      error: "Server wallet not configured (PRIVATE_KEY missing). Sign the transaction from your client wallet.",
      clientSigning: true,
      contractAddress: process.env.CONTRACT_ADDRESS || "",
    });
  }

  try {
    const tx = await contract.authenticateVideo(hash.trim());
    const receipt = await tx.wait();

    res.json({
      txHash:      receipt.hash,
      blockNumber: Number(receipt.blockNumber),
      creator:     await signer.getAddress(),
      timestamp:   Math.floor(Date.now() / 1000),
      hash:        hash.trim(),
    });
  } catch (err) {
    // Handle "Already authenticated" revert cleanly
    if (err?.reason?.includes("Already authenticated") || err?.message?.includes("Already authenticated")) {
      return res.status(409).json({ error: "Hash already authenticated on-chain.", hash: hash.trim() });
    }
    console.error("[authenticate]", err);
    res.status(500).json({ error: "Transaction failed.", detail: err.reason || err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/verify/:hash
   Read the on-chain proof for a video hash.

   Response: { authenticated: true, creator: string, timestamp: number, hash: string }
         or: { authenticated: false, hash: string }
───────────────────────────────────────────────────────────────────────────── */
router.get("/verify/:hash", async (req, res) => {
  const hash = req.params.hash?.trim();
  if (!hash) {
    return res.status(400).json({ error: "Hash parameter is required." });
  }

  const { contract } = getContractSetup();

  try {
    const [creator, timestamp] = await contract.verifyVideo(hash);
    res.json({
      authenticated: true,
      creator,
      timestamp: Number(timestamp),
      hash,
    });
  } catch (err) {
    // "Not authenticated" is a normal / expected revert
    if (err?.reason?.includes("Not authenticated") || err?.message?.includes("Not authenticated")) {
      return res.json({ authenticated: false, hash });
    }
    console.error("[verify]", err);
    res.status(500).json({ error: "Verification failed.", detail: err.reason || err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/info
   Return contract address and whether the server wallet is configured.
───────────────────────────────────────────────────────────────────────────── */
router.get("/info", (_req, res) => {
  const { signer } = getContractSetup();
  const rawAddr  = process.env.CONTRACT_ADDRESS || "";
  const addrMatch = rawAddr.match(/0x[0-9a-fA-F]{40}/);
  res.json({
    contractAddress:    addrMatch ? addrMatch[0] : null,
    rpcUrl:             (process.env.RPC_URL || "").trim() || null,
    serverWallet:       signer ? (/** @type {import("ethers").Wallet} */ (signer)).address : null,
    serverSigning:      !!signer,
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/data360/passport
   Build a verifiable Data360 "passport" from World Bank data.

   Body (JSON): { indicator: string, country: string, date?: "YYYY"|"YYYY:YYYY", limit?: number }
   Response: { passport, hash, verifyUrl, qrDataUrl }
──────────────────────────────────────────────────────────────────────────── */
router.post("/data360/passport", express.json(), async (req, res) => {
  const { indicator, country, date, limit, database } = req.body || {};

  try {
    const { passport, hash, query } = await buildData360Passport({
      indicator,
      country,
      date,
      limit,
      database,
    });
    await savePassport(hash, passport);

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const verifyUrl = buildVerifyUrl(frontendUrl, hash, query, passport.issuedAt);
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "H",
      margin: 4,
      width: 512,
      color: { dark: "#000000", light: "#ffffff" },
    });

    res.json({ passport, hash, verifyUrl, qrDataUrl });
  } catch (err) {
    console.error("[data360/passport]", err);
    const status = err.status || 500;
    const message = err.message || "Data360 passport creation failed.";
    res.status(status).json({ error: message });
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/data360/passport/:hash
   Return a previously generated passport by hash.
──────────────────────────────────────────────────────────────────────────── */
router.get("/data360/passport/:hash", async (req, res) => {
  const hash = req.params.hash?.trim();
  if (!hash || !HASH_RE.test(hash)) {
    return res.status(400).json({ error: "Hash parameter must be a 64-character hex string." });
  }
  try {
    const passport = await loadPassport(hash);
    if (!passport) return res.status(404).json({ error: "Passport not found." });
    res.json({ passport });
  } catch (err) {
    console.error("[data360/passport]", err);
    res.status(500).json({ error: "Failed to load passport.", detail: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/data360/verify/:hash
   Verify a passport hash and optionally check on-chain anchoring.
──────────────────────────────────────────────────────────────────────────── */
router.get("/data360/verify/:hash", async (req, res) => {
  const hash = req.params.hash?.trim();
  if (!hash || !HASH_RE.test(hash)) {
    return res.status(400).json({ error: "Hash parameter must be a 64-character hex string." });
  }

  try {
    let passport = await loadPassport(hash);
    if (!passport) {
      const indicator = req.query.indicator;
      const country = req.query.country;
      const date = req.query.date;
      const limit = req.query.limit;
      const database = req.query.database;
      const issuedAt = req.query.issuedAt;

      if (indicator && country && issuedAt) {
        try {
          const rebuilt = await buildData360Passport({
            indicator,
            country,
            date,
            limit,
            database,
            issuedAt,
          });
          if (rebuilt.hash === hash) {
            passport = rebuilt.passport;
            await savePassport(hash, passport);
          }
        } catch (err) {
          if (err.status === 400) {
            return res.status(400).json({ error: err.message });
          }
        }
      }
    }
    if (!passport) return res.status(404).json({ error: "Passport not found." });

    const { hash: storedHash, ...payload } = passport;
    const computed = sha256Hex(stableStringify(payload));
    const valid = computed === storedHash && storedHash === hash;

    let chain = null;
    const { contract } = getContractSetup();
    try {
      const [creator, timestamp] = await contract.verifyVideo(hash);
      chain = { authenticated: true, creator, timestamp: Number(timestamp) };
    } catch (err) {
      if (err?.reason?.includes("Not authenticated") || err?.message?.includes("Not authenticated")) {
        chain = { authenticated: false };
      } else {
        console.error("[data360/verify]", err);
        return res.status(500).json({ error: "On-chain verification failed.", detail: err.reason || err.message });
      }
    }

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const verifyUrl = buildVerifyUrl(frontendUrl, hash, payload.data360?.query, payload.issuedAt);
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "H",
      margin: 4,
      width: 512,
      color: { dark: "#000000", light: "#ffffff" },
    });

    res.json({ hash, valid, passport, chain, verifyUrl, qrDataUrl });
  } catch (err) {
    console.error("[data360/verify]", err);
    res.status(500).json({ error: "Passport verification failed.", detail: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/stats
   Live on-chain stats: total proofs authenticated + 5 most-recent proofs.
   Returns zeros gracefully when the node is unreachable.
───────────────────────────────────────────────────────────────────────────── */
router.get("/stats", async (_req, res) => {
  const { contract, provider } = getContractSetup();
  try {
    const blockNumber = await provider.getBlockNumber();
    const fromBlock   = Math.max(0, blockNumber - 9_900);
    const filter      = contract.filters.VideoAuthenticated();
    const events      = await contract.queryFilter(filter, fromBlock, "latest");

    const recent = events
      .slice(-5)
      .reverse()
      .map((e) => ({
        videoHash:   e.args.videoHash,
        creator:     e.args.creator,
        timestamp:   Number(e.args.timestamp),
        blockNumber: Number(e.blockNumber),
        txHash:      e.transactionHash,
      }));

    res.json({ totalProofs: events.length, recentProofs: recent, blockNumber: Number(blockNumber) });
  } catch (_err) {
    // Any RPC/network failure → return graceful zeros
    res.json({ totalProofs: 0, recentProofs: [], blockNumber: 0, offline: true });
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/recent?limit=20
   Paginated list of VideoAuthenticated events, newest first.
───────────────────────────────────────────────────────────────────────────── */
router.get("/recent", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const { contract, provider } = getContractSetup();
  try {
    const blockNumber = await provider.getBlockNumber();
    const fromBlock   = Math.max(0, blockNumber - 9_900);
    const filter      = contract.filters.VideoAuthenticated();
    const events      = await contract.queryFilter(filter, fromBlock, "latest");

    const proofs = events
      .slice(-limit)
      .reverse()
      .map((e) => ({
        videoHash:   e.args.videoHash,
        creator:     e.args.creator,
        timestamp:   Number(e.args.timestamp),
        blockNumber: Number(e.blockNumber),
        txHash:      e.transactionHash,
      }));

    res.json({ proofs, total: events.length, blockNumber: Number(blockNumber) });
  } catch (_err) {
    // Any RPC/network failure → return graceful zeros
    res.json({ proofs: [], total: 0, blockNumber: 0, offline: true });
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/qr/:hash
   Generate a QR code PNG (data URL) linking to the verify page for this hash.
   The verify URL is: FRONTEND_URL/verify?hash=<hash>
───────────────────────────────────────────────────────────────────────────── */
router.get("/qr/:hash", async (req, res) => {
  const hash = req.params.hash?.trim();
  if (!hash) return res.status(400).json({ error: "Hash parameter is required." });

  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  const verifyUrl   = `${frontendUrl}/verify?hash=${encodeURIComponent(hash)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "H",
      margin: 4,
      width: 512,
      color: { dark: "#000000", light: "#ffffff" },
    });
    res.json({ qrDataUrl, verifyUrl, hash });
  } catch (err) {
    console.error("[qr]", err);
    res.status(500).json({ error: "QR code generation failed.", detail: err.message });
  }
});

/* ── /api/whitepaper — generate and stream the Hashmark Protocol whitepaper PDF ── */
router.get("/whitepaper", (req, res) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="hashmark-protocol-whitepaper.pdf"');

  const doc = new PDFDoc({ size: "A4", margins: { top: 72, bottom: 72, left: 72, right: 72 }, info: {
    Title: "Hashmark Protocol — Whitepaper",
    Author: "Hashmark Protocol",
    Subject: "Blockchain-Based Video Authentication",
    Keywords: "blockchain, video authentication, SHA-256, Ethereum, smart contracts",
  }});

  doc.pipe(res);

  const GOLD   = "#D4A843";
  const DARK   = "#111111";
  const BODY   = "#333333";
  const SUB    = "#666666";
  const W      = 451; // usable width

  // ── Cover ──
  doc.rect(0, 0, 595, 842).fill("#0a0a16");
  doc.rect(0, 0, 595, 6).fill(GOLD);
  doc.rect(0, 836, 595, 6).fill(GOLD);

  doc.font("Helvetica-Bold").fontSize(36).fillColor(GOLD).text("HASHMARK", 72, 180, { width: W, align: "center" });
  doc.font("Helvetica").fontSize(16).fillColor("#ffffff").text("Protocol", 72, 222, { width: W, align: "center" });
  doc.moveDown(2);
  doc.font("Helvetica").fontSize(12).fillColor("#aaaaaa").text("Blockchain-Based Video Authentication", 72, 260, { width: W, align: "center" });
  doc.font("Helvetica").fontSize(10).fillColor("#888888").text("Technical Whitepaper — v1.0", 72, 285, { width: W, align: "center" });

  doc.rect(72, 320, W, 1).fill(GOLD).fillOpacity(0.4);

  doc.font("Helvetica").fontSize(10).fillColor("#888888").text(
    "An open protocol for cryptographic video fingerprinting and\non-chain authenticity verification using Ethereum smart contracts.",
    72, 340, { width: W, align: "center" }
  );

  doc.rect(72, 430, W, 1).fill("#333333");
  doc.font("Helvetica").fontSize(9).fillColor("#666666").text("hashmark.protocol  ·  Ethereum  ·  Foundry  ·  SHA-256", 72, 445, { width: W, align: "center" });
  doc.font("Helvetica").fontSize(9).fillColor("#555555").text(`Published ${new Date().toDateString()}`, 72, 462, { width: W, align: "center" });

  // ── New page — Abstract ──
  doc.addPage({ size: "A4", margins: { top: 72, bottom: 72, left: 72, right: 72 } });

  const h1 = (text) => {
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(20).fillColor(GOLD).text(text, { width: W });
    doc.rect(72, doc.y + 4, W, 2).fill(GOLD).fillOpacity(0.3);
    doc.moveDown(0.8);
  };
  const h2 = (text) => {
    doc.moveDown(0.4);
    doc.font("Helvetica-Bold").fontSize(13).fillColor(DARK).text(text, { width: W });
    doc.moveDown(0.3);
  };
  const body = (text) => {
    doc.font("Helvetica").fontSize(10).fillColor(BODY).text(text, { width: W, lineGap: 4 });
    doc.moveDown(0.5);
  };
  const bullet = (text) => {
    doc.font("Helvetica").fontSize(10).fillColor(BODY).text(`• ${text}`, { width: W - 16, indent: 16, lineGap: 3 });
  };
  const code = (text) => {
    doc.rect(doc.x, doc.y, W, doc.heightOfString(text, { width: W - 24 }) + 16).fill("#f4f4f4");
    doc.font("Courier").fontSize(9).fillColor("#222222").text(text, doc.x + 12, doc.y - doc.heightOfString(text, { width: W - 24 }) - 16 + 8, { width: W - 24, lineGap: 3 });
    doc.moveDown(0.8);
  };

  // Page header helper
  const pageHeader = () => {
    doc.rect(72, 40, W, 1).fill("#eeeeee");
    doc.font("Helvetica").fontSize(8).fillColor(SUB).text("HASHMARK PROTOCOL — WHITEPAPER", 72, 50, { width: W / 2 });
    doc.font("Helvetica").fontSize(8).fillColor(SUB).text(`Page ${doc.bufferedPageRange().start + 1}`, 72, 50, { width: W, align: "right" });
    doc.rect(72, 60, W, 1).fill("#eeeeee");
  };

  pageHeader();

  h1("Abstract");
  body(
    "Hashmark Protocol is an open, permissionless system for authenticating digital video content " +
    "using cryptographic fingerprinting and Ethereum smart contracts. The protocol computes a " +
    "SHA-256 hash of a video file in the user's browser, submits that hash to an immutable " +
    "on-chain registry via MetaMask, and issues a verifiable certificate binding the hash to a " +
    "wallet address and block timestamp. Any third party can independently verify a video's " +
    "authenticity by recomputing its hash and querying the public ledger — without trusting any " +
    "central server."
  );

  h1("1. Introduction");
  body(
    "The proliferation of synthetic and manipulated video content has created an urgent need for " +
    "trustworthy provenance infrastructure. Existing solutions rely on centralised databases, " +
    "proprietary watermarking, or ad-hoc metadata — all of which are mutable, censorable, and " +
    "require trusting a single authority."
  );
  body(
    "Hashmark Protocol approaches the problem differently: rather than storing the video itself, " +
    "it stores only an unforgeable cryptographic fingerprint on a public, append-only blockchain. " +
    "The video remains under the creator's full control; the ledger record is the proof."
  );

  h1("2. Protocol Design");
  h2("2.1 Fingerprinting");
  body(
    "SHA-256 is computed client-side using the Web Crypto API (SubtleCrypto.digest). " +
    "The computation occurs entirely in the browser — the raw video bytes never leave the " +
    "user's device. Any single-bit change to the video produces an entirely different hash " +
    "(avalanche effect), making tampering cryptographically detectable."
  );
  code(
    "const buf  = await file.arrayBuffer();\n" +
    "const hash = await crypto.subtle.digest('SHA-256', buf);\n" +
    "// → 32-byte array → 64-char lowercase hex string"
  );

  h2("2.2 On-Chain Registry");
  body(
    "The Hashmark smart contract is deployed on Ethereum (or any EVM-compatible chain). " +
    "It stores a mapping from SHA-256 hash to (creator address, block timestamp). " +
    "Authentication is a single write transaction; verification is a free read."
  );
  code(
    "// SPDX-License-Identifier: MIT\n" +
    "pragma solidity ^0.8.20;\n\n" +
    "contract Hashmark {\n" +
    "    struct Record { address creator; uint256 timestamp; }\n" +
    "    mapping(bytes32 => Record) private registry;\n\n" +
    "    function authenticateVideo(string calldata videoHash) external {\n" +
    "        bytes32 key = keccak256(abi.encodePacked(videoHash));\n" +
    "        require(registry[key].timestamp == 0, 'Already authenticated');\n" +
    "        registry[key] = Record(msg.sender, block.timestamp);\n" +
    "        emit VideoAuthenticated(videoHash, msg.sender, block.timestamp);\n" +
    "    }\n\n" +
    "    function verifyVideo(string calldata videoHash)\n" +
    "        external view returns (address creator, uint256 timestamp) {\n" +
    "        bytes32 key = keccak256(abi.encodePacked(videoHash));\n" +
    "        Record memory r = registry[key];\n" +
    "        return (r.creator, r.timestamp);\n" +
    "    }\n" +
    "}"
  );

  doc.addPage();
  pageHeader();

  h2("2.3 Transaction Flow");
  body("The end-to-end authentication flow is:");
  ["1. User records or selects a video in the browser.",
   "2. SHA-256 fingerprint is computed client-side (no upload required).",
   "3. User connects MetaMask wallet and approves the chain switch to the target network.",
   "4. Frontend calls authenticateVideo(hash) on the smart contract via ethers.js.",
   "5. MetaMask prompts the user to sign and broadcast the transaction.",
   "6. Frontend waits for block confirmation (tx.wait()).",
   "7. Receipt delivers real tx hash, block number, and timestamp.",
   "8. Backend generates a QR code linking to the public verification URL.",
   "9. User downloads the authenticated video and/or a JSON certificate."
  ].forEach(s => bullet(s));
  doc.moveDown(0.5);

  h2("2.4 Verification Flow");
  body("Any party wishing to verify authenticity:");
  ["1. Drops the video file into the Verify tab (or navigates to /verify?hash=<sha256>).",
   "2. Browser recomputes the SHA-256 hash of the uploaded file.",
   "3. Frontend queries GET /api/verify/:hash on the backend.",
   "4. Backend calls verifyVideo(hash) on the read-only contract — zero gas cost.",
   "5. If the record exists, the original creator address and block timestamp are returned.",
   "6. Result is displayed with the QR code and a downloadable certificate."
  ].forEach(s => bullet(s));
  doc.moveDown(0.5);

  h1("3. Security Properties");
  h2("3.1 Collision Resistance");
  body(
    "SHA-256 has 2^256 possible outputs. Finding two videos with the same hash requires " +
    "computational work exceeding the energy budget of the observable universe under current " +
    "cryptanalysis. The probability of an accidental collision is negligible."
  );
  h2("3.2 Immutability");
  body(
    "Once written to the Ethereum blockchain, a record cannot be deleted or modified. " +
    "The smart contract enforces this at the EVM level: authenticateVideo reverts if the " +
    "hash is already registered. Even the contract deployer cannot alter existing records."
  );
  h2("3.3 Non-custodial");
  body(
    "The protocol is fully non-custodial. No server ever holds private keys, passwords, or " +
    "video content. Authentication is signed exclusively by the user's MetaMask wallet. " +
    "The backend is stateless and serves only as a query layer."
  );
  h2("3.4 Transparency");
  body(
    "All authentication events are emitted as VideoAuthenticated events on the public blockchain. " +
    "Any Ethereum node can independently verify the full history without trusting the Hashmark " +
    "application server."
  );

  doc.addPage();
  pageHeader();

  h1("4. Technical Stack");
  const stack = [
    ["Smart Contract", "Solidity ^0.8.20 — deployed with Foundry (forge create)"],
    ["Blockchain", "Ethereum (EVM-compatible) — local development via Anvil"],
    ["Frontend",  "React 19 + TypeScript + Vite — direct ethers.js v6 contract calls"],
    ["Wallet",    "MetaMask — wallet_addEthereumChain + eth_requestAccounts"],
    ["Hashing",   "SubtleCrypto (Web Crypto API) — SHA-256, client-side"],
    ["Backend",   "Node.js + Express — verification proxy, QR generation (qrcode), faucet"],
    ["QR Codes",  "node-qrcode — 512×512px PNG, error correction level H"],
    ["Testing",   "Foundry forge test — unit tests for contract logic"],
  ];
  stack.forEach(([k, v]) => {
    doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK).text(k + ": ", { continued: true, width: W });
    doc.font("Helvetica").fontSize(10).fillColor(BODY).text(v, { lineGap: 4 });
  });
  doc.moveDown(0.5);

  h1("5. Deployment");
  h2("5.1 Local Development");
  code(
    "# Start local blockchain\ncd back && npm run node:local\n\n" +
    "# Deploy contract (auto-patches .env)\nnpm run deploy:local\n\n" +
    "# Start backend API\nnpm start\n\n" +
    "# Start frontend\ncd .. && npm run dev"
  );
  h2("5.2 Mainnet / Sepolia");
  body("Set SEPOLIA_RPC_URL and DEPLOY_PRIVATE_KEY in back/.env, then:");
  code("cd back && npm run deploy:sepolia");

  h1("6. API Reference");
  const apis = [
    ["GET /api/stats",           "Returns total proof count and latest block number"],
    ["GET /api/verify/:hash",    "Queries on-chain record — returns creator, timestamp, authenticated"],
    ["GET /api/qr/:hash",        "Returns 512px PNG QR code data URL for the verify URL"],
    ["GET /api/whitepaper",      "Streams this PDF document"],
    ["POST /api/faucet",         "Funds a wallet address with 10 ETH on local Anvil (dev only)"],
    ["POST /api/hash/file",      "Accepts multipart video upload, returns SHA-256"],
    ["POST /api/authenticate",   "Server-side authentication (requires PRIVATE_KEY in .env)"],
    ["GET /api/recent",          "Returns the most recent VideoAuthenticated events"],
    ["GET /api/health",          "Health check — returns status and contract address"],
  ];
  apis.forEach(([endpoint, desc]) => {
    doc.font("Courier").fontSize(9).fillColor("#1a6a9a").text(endpoint, { continued: true, width: W });
    doc.font("Helvetica").fontSize(9).fillColor(SUB).text("  — " + desc, { lineGap: 5 });
  });

  doc.addPage();
  pageHeader();

  h1("7. Certificate Format");
  body(
    "After successful authentication, the user can download a JSON certificate. " +
    "This document is a portable, human-readable record of the authentication event:"
  );
  code(
    '{\n' +
    '  "txHash":    "0xabc...123",\n' +
    '  "videoHash": "sha256:1a2b3c...",\n' +
    '  "creator":   "0xYourWalletAddress",\n' +
    '  "block":     4872341,\n' +
    '  "timestamp": "2026-03-01 12:00:00 UTC",\n' +
    '  "network":   "Ethereum Mainnet"\n' +
    '}'
  );
  body(
    "The certificate can be independently verified by anyone with access to an Ethereum " +
    "node: recompute the video's SHA-256, call verifyVideo(hash) on the contract, and " +
    "compare the returned creator address and timestamp to the certificate."
  );

  h1("8. Roadmap");
  ["Decentralised storage integration (IPFS/Filecoin) for optional video archiving",
   "EIP-712 structured signing for richer certificate metadata",
   "Batch authentication for news organisations and media agencies",
   "Browser extension for inline video verification on social platforms",
   "Layer-2 deployment (Optimism / Base) for lower gas costs",
   "Cross-chain registry with a unified resolver",
  ].forEach(s => bullet(s));
  doc.moveDown(0.8);

  h1("9. Conclusion");
  body(
    "Hashmark Protocol provides a minimal, trustless foundation for video authenticity " +
    "in the age of synthetic media. By anchoring cryptographic fingerprints to an " +
    "immutable public ledger and keeping all sensitive operations client-side, it achieves " +
    "strong security guarantees without requiring users to trust any centralised service."
  );
  body(
    "The protocol is intentionally simple: one smart contract, one hash function, one " +
    "transaction per video. This simplicity is a feature — it makes the system auditable, " +
    "portable, and resistant to single points of failure."
  );

  // Footer on last page
  doc.rect(72, 780, W, 1).fill("#dddddd");
  doc.font("Helvetica").fontSize(8).fillColor(SUB)
    .text("© Hashmark Protocol — open source — all rights reserved", 72, 790, { width: W, align: "center" });

  doc.end();
});

/* ── /api/faucet — fund any address on local Anvil with 10 ETH ── */
router.post("/faucet", express.json(), async (req, res) => {
  const { address } = req.body || {};
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address))
    return res.status(400).json({ error: "Valid Ethereum address required." });

  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";

  try {
    const resp = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", method: "anvil_setBalance",
        params: [address, "0x8AC7230489E80000"], // 10 ETH
        id: 1,
      }),
    });
    const data = await resp.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    res.json({ success: true, address, funded: "10 ETH" });
  } catch (err) {
    res.status(500).json({ error: "Faucet failed — is Anvil running?", detail: err.message });
  }
});

/* ── /api/waitlist — store email for early access ── */
const WAITLIST_FILE = path.join(__dirname, "..", "waitlist.json");

function readWaitlist() {
  try { return JSON.parse(fs.readFileSync(WAITLIST_FILE, "utf8")); }
  catch { return []; }
}
function writeWaitlist(entries) {
  fs.writeFileSync(WAITLIST_FILE, JSON.stringify(entries, null, 2));
}

router.post("/waitlist", express.json(), (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: "Valid email address required." });

  const entries = readWaitlist();
  if (entries.find(e => e.email === email))
    return res.status(409).json({ error: "Email already registered." });

  const entry = { email, joinedAt: new Date().toISOString() };
  entries.push(entry);
  writeWaitlist(entries);
  console.log("[waitlist]", email, entry.joinedAt);
  res.json({ success: true, message: "You're on the list!" });
});

router.get("/waitlist", (_req, res) => {
  const entries = readWaitlist();
  res.json({ count: entries.length, entries });
});

module.exports = router;
