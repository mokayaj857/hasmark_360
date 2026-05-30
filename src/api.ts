// Frontend API client for Hashmark backend
// Defaults to the Vite proxy at /api unless VITE_API_BASE is provided.

const BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

export interface HashFileResult {
  hash: string;
  filename: string;
  size: number;
  mimetype: string;
}

export interface AuthenticateResult {
  txHash: string;
  blockNumber: number;
  creator: string;
  timestamp: number;
  hash: string;
}

export interface VerifyResult {
  authenticated: boolean;
  creator?: string;
  timestamp?: number;
  hash: string;
}

export interface InfoResult {
  contractAddress: string | null;
  rpcUrl: string | null;
  serverWallet: string | null;
  serverSigning: boolean;
}

export interface ProofEvent {
  videoHash: string;
  creator: string;
  timestamp: number;
  blockNumber: number;
  txHash: string;
}

export interface StatsResult {
  totalProofs: number;
  recentProofs: ProofEvent[];
  blockNumber: number;
  offline?: boolean;
}

export interface RecentResult {
  proofs: ProofEvent[];
  total: number;
  blockNumber: number;
  offline?: boolean;
}

export interface QrResult {
  qrDataUrl: string;
  verifyUrl: string;
  hash: string;
}

export interface VideoInfo {
  hash: string;
  filename: string;
  mimetype: string;
  size: number;
  storedAt: string;
  url: string;
}

export interface Data360SeriesPoint {
  date: string;
  value: number | null;
  unit?: string;
  obsStatus?: string;
  decimals?: number | null;
}

export interface Data360Passport {
  version: string;
  issuedAt: string;
  issuer: string;
  data360: {
    apiBaseUrl: string;
    dataUrl: string;
    query: {
      indicator: string;
      database?: string;
      country: string;
      date: string | null;
      limit: number;
    };
    indicator: {
      id: string;
      name: string;
      unit: string;
    };
    country: {
      id: string;
      name: string;
      iso3: string;
    };
    series: Data360SeriesPoint[];
  };
  hash: string;
}

export interface Data360PassportResponse {
  passport: Data360Passport;
  hash: string;
  verifyUrl: string;
  qrDataUrl: string;
}

export interface Data360VerifyResponse {
  hash: string;
  valid: boolean;
  passport: Data360Passport;
  chain: {
    authenticated: boolean;
    creator?: string;
    timestamp?: number;
  } | null;
  verifyUrl: string;
  qrDataUrl: string;
}

export interface Data360VerifyOptions {
  indicator?: string;
  database?: string;
  country?: string;
  date?: string;
  limit?: number;
  issuedAt?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

/** Upload a file and compute its SHA-256 hash on the server. */
export async function hashFile(file: File): Promise<HashFileResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/hash/file`, { method: "POST", body: form });
  return handleResponse<HashFileResult>(res);
}

/** Hash a raw string value. */
export async function hashRaw(value: string): Promise<{ hash: string }> {
  const res = await fetch(`${BASE}/hash/raw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });
  return handleResponse<{ hash: string }>(res);
}

/**
 * Authenticate a video hash on-chain via the server wallet.
 * Returns 503 + { clientSigning: true } when server has no private key.
 */
export async function authenticateHash(hash: string): Promise<AuthenticateResult> {
  const res = await fetch(`${BASE}/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hash }),
  });
  return handleResponse<AuthenticateResult>(res);
}

/** Verify whether a hash has been authenticated on-chain. */
export async function verifyHash(hash: string): Promise<VerifyResult> {
  const res = await fetch(`${BASE}/verify/${encodeURIComponent(hash)}`);
  return handleResponse<VerifyResult>(res);
}

/** Get live on-chain stats: total proofs + 5 most recent. */
export async function getStats(): Promise<StatsResult> {
  const res = await fetch(`${BASE}/stats`);
  return handleResponse<StatsResult>(res);
}

/** Get paginated list of recent VideoAuthenticated events. */
export async function getRecent(limit = 20): Promise<RecentResult> {
  const res = await fetch(`${BASE}/recent?limit=${limit}`);
  return handleResponse<RecentResult>(res);
}

/** Get a QR code data URL linking to the verify page for a hash. */
export async function getQrCode(hash: string, target?: "verify" | "watch"): Promise<QrResult> {
  const query = target ? `?target=${encodeURIComponent(target)}` : "";
  const res = await fetch(`${BASE}/qr/${encodeURIComponent(hash)}${query}`);
  return handleResponse<QrResult>(res);
}

/** Upload and store a video by hash so it can be streamed later. */
export async function uploadVideo(file: File, hash?: string): Promise<VideoInfo> {
  const form = new FormData();
  form.append("file", file);
  if (hash) form.append("hash", hash);
  const res = await fetch(`${BASE}/videos`, { method: "POST", body: form });
  return handleResponse<VideoInfo>(res);
}

/** Fetch stored video metadata by hash. */
export async function getVideoInfo(hash: string): Promise<VideoInfo> {
  const res = await fetch(`${BASE}/videos/${encodeURIComponent(hash)}/info`);
  return handleResponse<VideoInfo>(res);
}

/** Build the streaming URL for a stored video. */
export function getVideoUrl(hash: string): string {
  return `${BASE}/videos/${encodeURIComponent(hash)}`;
}

/** Get backend / contract info. */
export async function getInfo(): Promise<InfoResult> {
  const res = await fetch(`${BASE}/info`);
  return handleResponse<InfoResult>(res);
}

/** Check backend health. */
export async function healthCheck(): Promise<{ ok: boolean; timestamp: number }> {
  const res = await fetch(`${BASE}/health`);
  return handleResponse(res);
}

/** Build a Data360 passport from World Bank data. */
export async function createData360Passport(payload: {
  indicator: string;
  country: string;
  date?: string;
  limit?: number;
}): Promise<Data360PassportResponse> {
  const res = await fetch(`${BASE}/data360/passport`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<Data360PassportResponse>(res);
}

/** Verify a Data360 passport by hash. */
export async function verifyData360Passport(hash: string, options?: Data360VerifyOptions): Promise<Data360VerifyResponse> {
  const params = new URLSearchParams();
  if (options?.indicator) params.set("indicator", options.indicator);
  if (options?.database) params.set("database", options.database);
  if (options?.country) params.set("country", options.country);
  if (options?.date) params.set("date", options.date);
  if (options?.issuedAt) params.set("issuedAt", options.issuedAt);
  if (typeof options?.limit === "number" && Number.isFinite(options.limit)) {
    params.set("limit", String(options.limit));
  }
  const query = params.toString();
  const res = await fetch(`${BASE}/data360/verify/${encodeURIComponent(hash)}${query ? `?${query}` : ""}`);
  return handleResponse<Data360VerifyResponse>(res);
}
