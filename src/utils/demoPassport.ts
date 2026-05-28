import type { Data360SeriesPoint } from "../api";

export interface NormalizedPoint {
  year: number;
  value: number;
  unit?: string;
}

export interface FactPayload {
  version: string;
  issuedAt: string;
  dataHash: string;
  query: {
    indicator: string;
    database?: string;
    country: string;
    date: string | null;
    limit: number;
  };
  summary: string;
  chartDataUrl: string;
}

export function stableStringify(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(",")}}`;
}

export async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function normalizeSeries(series: Data360SeriesPoint[]): NormalizedPoint[] {
  return series
    .map((point) => ({
      year: Number(point.date),
      value: point.value ?? null,
      unit: point.unit,
    }))
    .filter((point) => Number.isFinite(point.year) && Number.isFinite(point.value))
    .map((point) => ({ year: point.year, value: Number(point.value), unit: point.unit }))
    .sort((a, b) => a.year - b.year);
}

export function buildSummary(points: NormalizedPoint[], countryLabel: string): string {
  if (!points.length) return `No recent data points are available for ${countryLabel}.`;
  const first = points[0];
  const last = points[points.length - 1];
  const delta = last.value - first.value;
  const trend = Math.abs(delta) < 0.05 ? "held steady" : delta < 0 ? "declined" : "increased";
  const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  return `Youth unemployment in ${countryLabel} has ${trend} from ${fmt.format(first.value)}% in ${first.year} to ${fmt.format(last.value)}% in ${last.year}, according to World Bank Data360.`;
}

export function buildChartSvg(points: NormalizedPoint[], title: string): string {
  const width = 720;
  const height = 360;
  const padding = { top: 40, right: 32, bottom: 40, left: 56 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  if (!points.length) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#0f1117" rx="16"/>
  <text x="50%" y="50%" fill="#9aa4b2" font-family="Inter, sans-serif" font-size="14" text-anchor="middle">No data available</text>
</svg>`;
  }

  const values = points.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (Math.abs(max - min) < 0.01) {
    min -= 1;
    max += 1;
  }

  const toX = (index: number) => padding.left + (plotW * index) / Math.max(points.length - 1, 1);
  const toY = (value: number) => padding.top + plotH - ((value - min) / (max - min)) * plotH;

  const line = points.map((point, idx) => `${toX(idx)},${toY(point.value)}`).join(" ");
  const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
  const first = points[0];
  const last = points[points.length - 1];

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4ade80"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="#0f1117" rx="16"/>
  <text x="${padding.left}" y="28" fill="#e5e7eb" font-family="Inter, sans-serif" font-size="16" font-weight="600">${title}</text>
  <line x1="${padding.left}" y1="${padding.top + plotH}" x2="${padding.left + plotW}" y2="${padding.top + plotH}" stroke="#1f2937" stroke-width="1"/>
  <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + plotH}" stroke="#1f2937" stroke-width="1"/>
  <polyline fill="none" stroke="url(#lineGradient)" stroke-width="3" points="${line}" />
  ${points.map((point, idx) => `<circle cx="${toX(idx)}" cy="${toY(point.value)}" r="4" fill="#fbbf24" />`).join("")}
  <text x="${toX(0)}" y="${padding.top + plotH + 24}" fill="#9aa4b2" font-family="Inter, sans-serif" font-size="12" text-anchor="start">${first.year}</text>
  <text x="${toX(points.length - 1)}" y="${padding.top + plotH + 24}" fill="#9aa4b2" font-family="Inter, sans-serif" font-size="12" text-anchor="end">${last.year}</text>
  <text x="${toX(0)}" y="${toY(first.value) - 10}" fill="#d1d5db" font-family="Inter, sans-serif" font-size="12" text-anchor="start">${fmt.format(first.value)}%</text>
  <text x="${toX(points.length - 1)}" y="${toY(last.value) - 10}" fill="#d1d5db" font-family="Inter, sans-serif" font-size="12" text-anchor="end">${fmt.format(last.value)}%</text>
</svg>`;
}

export function buildChartDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function buildFactHash(input: {
  issuedAt: string;
  dataHash: string;
  query: FactPayload["query"];
  summary: string;
  chartDataUrl: string;
}): Promise<{ payload: FactPayload; hash: string }> {
  const payload: FactPayload = {
    version: "hashmark-demo-v1",
    issuedAt: input.issuedAt,
    dataHash: input.dataHash,
    query: input.query,
    summary: input.summary,
    chartDataUrl: input.chartDataUrl,
  };
  const hash = await sha256Hex(stableStringify(payload));
  return { payload, hash };
}
