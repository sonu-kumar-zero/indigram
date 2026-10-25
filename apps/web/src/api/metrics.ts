const API_ROOT = (import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1").replace(/\/api\/v1\/?$/, "");

export type MetricSample = {
  name: string;
  labels: string;
  value: number;
};

export async function fetchMetrics(): Promise<MetricSample[]> {
  const response = await fetch(`${API_ROOT}/metrics`);
  if (!response.ok) throw new Error(`Metrics request failed (${response.status})`);

  const samples: MetricSample[] = [];
  for (const line of (await response.text()).split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{[^}]*\})?\s+([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)$/);
    if (match) samples.push({ name: match[1], labels: match[2] ?? "", value: Number(match[3]) });
  }
  return samples;
}
