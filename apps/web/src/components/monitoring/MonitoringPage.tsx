import { useEffect, useMemo, useState } from "react";
import { fetchMetrics, type MetricSample } from "../../api/metrics";

type Point = { time: number; value: number };

function latest(samples: MetricSample[], name: string): number {
  return samples.find((sample) => sample.name === name)?.value ?? 0;
}

function formatValue(value: number, unit = ""): string {
  if (!Number.isFinite(value)) return "—";
  if (unit === "bytes") {
    const suffixes = ["B", "KB", "MB", "GB"];
    let index = 0;
    while (value >= 1024 && index < suffixes.length - 1) {
      value /= 1024;
      index++;
    }
    return `${value.toFixed(index ? 1 : 0)} ${suffixes[index]}`;
  }
  return value >= 100 ? Math.round(value).toLocaleString() : value.toFixed(2);
}

function Sparkline({ points, color }: { points: Point[]; color: string }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  const min = Math.min(...points.map((point) => point.value), 0);
  const range = max - min || 1;
  const path = points.map((point, index) => {
    const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
    const y = 92 - ((point.value - min) / range) * 84;
    return `${index ? "L" : "M"}${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-20 w-full">
      <path d="M0,92 H100" stroke="currentColor" strokeOpacity=".12" vectorEffect="non-scaling-stroke" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function MetricCard({
  title,
  value,
  unit,
  points,
  color,
}: {
  title: string;
  value: string;
  unit?: string;
  points: Point[];
  color: string;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#101015] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{title}</p>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <p className="mt-3 text-2xl font-semibold text-zinc-100">{value}<span className="ml-1 text-sm font-normal text-zinc-500">{unit}</span></p>
      <div className="mt-3 text-zinc-500"><Sparkline points={points} color={color} /></div>
    </section>
  );
}

export function MonitoringPage() {
  const [samples, setSamples] = useState<MetricSample[]>([]);
  const [history, setHistory] = useState<Record<string, Point[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const next = await fetchMetrics();
      const time = Date.now();
      setSamples(next);
      setHistory((current) => {
        const updated = { ...current };
        for (const name of ["indigram_http_requests_in_flight", "indigram_process_resident_memory_bytes", "indigram_nodejs_heap_size_used_bytes"]) {
          const value = latest(next, name);
          updated[name] = [...(current[name] ?? []), { time, value }].slice(-30);
        }
        return updated;
      });
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load metrics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 10000);
    return () => window.clearInterval(interval);
  }, []);

  const grouped = useMemo(() => {
    const names = new Set(samples.map((sample) => sample.name));
    return [...names].sort();
  }, [samples]);
  const points = (name: string) => history[name] ?? [{ time: Date.now(), value: latest(samples, name) }];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#ff9675]">System health</p>
          <h1 className="mt-2 font-serif text-4xl text-zinc-100">API monitoring</h1>
          <p className="mt-2 text-sm text-zinc-500">Live application metrics, refreshed every 10 seconds.</p>
        </div>
        <button onClick={() => void refresh()} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-[#ff9675]/50 hover:text-[#ffb29b]">
          Refresh now
        </button>
      </div>
      {error && <p className="mt-6 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">{error}</p>}
      {loading ? <p className="mt-12 text-zinc-500">Loading metrics…</p> : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Requests in flight" value={formatValue(latest(samples, "indigram_http_requests_in_flight"))} points={points("indigram_http_requests_in_flight")} color="#ff9675" />
            <MetricCard title="Resident memory" value={formatValue(latest(samples, "indigram_process_resident_memory_bytes"), "bytes")} points={points("indigram_process_resident_memory_bytes")} color="#a78bfa" />
            <MetricCard title="Heap used" value={formatValue(latest(samples, "indigram_nodejs_heap_size_used_bytes"), "bytes")} points={points("indigram_nodejs_heap_size_used_bytes")} color="#67e8f9" />
            <MetricCard title="Total requests" value={formatValue(samples.filter((sample) => sample.name === "indigram_http_requests_total").reduce((sum, sample) => sum + sample.value, 0))} points={points("indigram_http_requests_in_flight")} color="#86efac" />
          </div>
          <section className="mt-8 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101015]">
            <div className="border-b border-white/[0.07] px-5 py-4">
              <h2 className="font-medium text-zinc-100">All metrics</h2>
              <p className="mt-1 text-xs text-zinc-500">{grouped.length} metric families reported by the API</p>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {grouped.map((name) => {
                const family = samples.filter((sample) => sample.name === name);
                return (
                  <div key={name} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                    <code className="text-[#ffb29b]">{name}</code>
                    <span className="text-zinc-400">{family.length === 1 ? formatValue(family[0].value) : `${family.length} series`}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
