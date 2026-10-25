import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from "prom-client";
import type { RequestHandler } from "express";

export const metricsRegistry = new Registry();

collectDefaultMetrics({ register: metricsRegistry, prefix: "indigram_" });

const httpRequestsTotal = new Counter({
  name: "indigram_http_requests_total",
  help: "Total number of HTTP requests handled by the API.",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [metricsRegistry]
});

const httpRequestDurationSeconds = new Histogram({
  name: "indigram_http_request_duration_seconds",
  help: "HTTP request duration in seconds.",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry]
});

const httpRequestsInFlight = new Gauge({
  name: "indigram_http_requests_in_flight",
  help: "Current number of HTTP requests being processed by the API.",
  registers: [metricsRegistry]
});

function getRouteLabel(req: Parameters<RequestHandler>[0]): string {
  if (req.route?.path) {
    return `${req.baseUrl || ""}${String(req.route.path)}`;
  }
  return "unmatched";
}

export const requestMetrics: RequestHandler = (req, res, next) => {
  if (req.path === "/metrics") {
    next();
    return;
  }

  const start = process.hrtime.bigint();
  httpRequestsInFlight.inc();

  res.once("finish", () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const labels = {
      method: req.method,
      route: getRouteLabel(req),
      status_code: String(res.statusCode)
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
    httpRequestsInFlight.dec();
  });

  next();
};

export function getMetrics(): Promise<string> {
  return metricsRegistry.metrics();
}

export function getMetricsContentType(): string {
  return metricsRegistry.contentType;
}
