"use client";

import { CheckCircle, XCircle } from "lucide-react";

interface Check {
  check: string;
  passed: boolean;
}

interface ScoreChecksProps {
  title: string;
  score: number;
  color: string;
  checks: Check[];
  locale: string;
}

export default function ScoreChecks({ title, score, color, checks, locale }: ScoreChecksProps) {
  const isAr = locale === "ar";
  const passCount = checks.filter((c) => c.passed).length;

  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 8px ${color}40`,
            }}
          />
          <h3 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)" }}>
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="font-num font-bold"
            style={{ fontSize: 20, color }}
          >
            {score.toFixed(1)}
          </span>
          <span style={{ fontSize: 11, color: "var(--c-muted)" }}>/5</span>
        </div>
      </div>

      {/* Pass/fail bar */}
      {checks.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              gap: 2,
              height: 4,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            {checks.map((c, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: c.passed ? color : "var(--c-border)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: 10, color: "var(--c-dim)", marginTop: 4 }}>
            {isAr
              ? `${passCount} من ${checks.length} اجتاز`
              : `${passCount} of ${checks.length} checks passed`}
          </p>
        </div>
      )}

      {/* Individual checks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {checks.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-2"
            style={{ fontSize: 12 }}
          >
            {c.passed ? (
              <CheckCircle
                size={14}
                style={{ color, flexShrink: 0 }}
              />
            ) : (
              <XCircle
                size={14}
                style={{ color: "var(--c-dim)", flexShrink: 0 }}
              />
            )}
            <span
              style={{
                color: c.passed ? "var(--c-text-sm)" : "var(--c-dim)",
              }}
            >
              {c.check}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
