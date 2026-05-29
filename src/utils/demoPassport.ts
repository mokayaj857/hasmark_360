import type { Data360SeriesPoint } from "../api";

export interface NormalizedPoint {
  year: number;
  value: number;
  unit?: string;
}

export interface FactDNA {
  version: string;
  issuedAt: string;
  dataHash: string;
  request: {
    question: string;
    category: string;
  };
  source: {
    authority: string;
    issuer: string;
    apiBaseUrl: string;
    dataUrl: string;
    indicator: {
      id: string;
      name: string;
      unit?: string;
    };
    country: {
      id: string;
      name: string;
      iso3: string;
    };
    period: string | null;
  };
  query: {
    indicator: string;
    database?: string;
    country: string;
    date: string | null;
    limit: number;
  };
  insight: {
    summary: string;
    chartDataUrl: string;
  };
  provenance: {
    creator: string;
    agent: string;
    generatedAt: string;
  };
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

export function normalizeSeries(series: Data360SeriesPoint[], fallbackUnit?: string): NormalizedPoint[] {
  return series
    .map((point) => ({
      year: Number(point.date),
      value: point.value ?? null,
      unit: point.unit || fallbackUnit,
    }))
    .filter((point) => Number.isFinite(point.year) && Number.isFinite(point.value))
    .map((point) => ({ year: point.year, value: Number(point.value), unit: point.unit }))
    .sort((a, b) => a.year - b.year);
}

function formatValue(value: number, unit?: string): string {
  const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  if (!unit) return fmt.format(value);
  const normalized = unit.toLowerCase().trim();
  if (!normalized) return fmt.format(value);
  if (normalized === "%" || normalized.includes("percent")) return `${fmt.format(value)}%`;
  return `${fmt.format(value)} ${unit}`;
}

export function buildSummary(
  points: NormalizedPoint[],
  context: { countryLabel: string; indicatorLabel: string; unitLabel?: string; sourceLabel?: string },
): string {
  const { countryLabel, indicatorLabel, unitLabel, sourceLabel = "World Bank Data360" } = context;
  const label = indicatorLabel || "This indicator";
  if (!points.length) return `No recent ${label} data are available for ${countryLabel} from ${sourceLabel}.`;
  const first = points[0];
  const last = points[points.length - 1];
  const delta = last.value - first.value;
  const trend = Math.abs(delta) < 0.05 ? "held steady" : delta < 0 ? "declined" : "increased";
  return `${label} in ${countryLabel} has ${trend} from ${formatValue(first.value, unitLabel)} in ${first.year} to ${formatValue(last.value, unitLabel)} in ${last.year}, based on official ${sourceLabel} evidence.`;
}

export function buildChartSvg(points: NormalizedPoint[], title: string, unitLabel?: string): string {
  const width = 720;
  const height = 360;
  const titleY = 26;
  const unitY = 44;
  const paddingTop = unitLabel ? 72 : 56;
  const padding = { top: paddingTop, right: 32, bottom: 44, left: 56 };
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
  const clamp = (value: number, minValue: number, maxValue: number) => Math.min(Math.max(value, minValue), maxValue);

  const line = points.map((point, idx) => `${toX(idx)},${toY(point.value)}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  const labelMinY = padding.top + 12;
  const labelMaxY = padding.top + plotH - 8;
  const firstLabelY = clamp(toY(first.value) - 10, labelMinY, labelMaxY);
  const lastLabelY = clamp(toY(last.value) - 10, labelMinY, labelMaxY);

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4ade80"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="#0f1117" rx="16"/>
  <text x="${padding.left}" y="${titleY}" fill="#e5e7eb" font-family="Inter, sans-serif" font-size="16" font-weight="600">${title}</text>
  ${unitLabel ? `<text x="${padding.left}" y="${unitY}" fill="#9aa4b2" font-family="Inter, sans-serif" font-size="12">Unit: ${unitLabel}</text>` : ""}
  <line x1="${padding.left}" y1="${padding.top + plotH}" x2="${padding.left + plotW}" y2="${padding.top + plotH}" stroke="#1f2937" stroke-width="1"/>
  <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + plotH}" stroke="#1f2937" stroke-width="1"/>
  <polyline fill="none" stroke="url(#lineGradient)" stroke-width="3" points="${line}" />
  ${points.map((point, idx) => `<circle cx="${toX(idx)}" cy="${toY(point.value)}" r="4" fill="#fbbf24" />`).join("")}
  <text x="${toX(0)}" y="${padding.top + plotH + 24}" fill="#9aa4b2" font-family="Inter, sans-serif" font-size="12" text-anchor="start">${first.year}</text>
  <text x="${toX(points.length - 1)}" y="${padding.top + plotH + 24}" fill="#9aa4b2" font-family="Inter, sans-serif" font-size="12" text-anchor="end">${last.year}</text>
  <text x="${toX(0)}" y="${firstLabelY}" fill="#d1d5db" font-family="Inter, sans-serif" font-size="12" text-anchor="start">${formatValue(first.value, unitLabel)}</text>
  <text x="${toX(points.length - 1)}" y="${lastLabelY}" fill="#d1d5db" font-family="Inter, sans-serif" font-size="12" text-anchor="end">${formatValue(last.value, unitLabel)}</text>
</svg>`;
}

export function buildChartDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function buildFactDNA(input: {
  issuedAt: string;
  dataHash: string;
  query: FactDNA["query"];
  request: FactDNA["request"];
  source: FactDNA["source"];
  creator: string;
  agent: string;
  generatedAt?: string;
  summary: string;
  chartDataUrl: string;
}): Promise<{ payload: FactDNA; hash: string }> {
  const payload: FactDNA = {
    version: "hashmark-fact-dna-v1",
    issuedAt: input.issuedAt,
    dataHash: input.dataHash,
    query: input.query,
    request: input.request,
    source: input.source,
    insight: {
      summary: input.summary,
      chartDataUrl: input.chartDataUrl,
    },
    provenance: {
      creator: input.creator,
      agent: input.agent,
      generatedAt: input.generatedAt || new Date().toISOString(),
    },
  };
  const hash = await sha256Hex(stableStringify(payload));
  return { payload, hash };
}
