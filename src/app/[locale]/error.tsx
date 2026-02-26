"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-wrap">
      <div className="card" style={{ padding: "48px 28px", textAlign: "center" }}>
        <div
          className="mx-auto mb-4"
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: "var(--c-red-bg)",
            border: "1px solid var(--c-red-ring)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertTriangle size={20} style={{ color: "var(--c-red)" }} />
        </div>
        <h1
          className="font-bold text-lg mb-2"
          style={{ color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}
        >
          Something went wrong
        </h1>
        <p style={{ color: "var(--c-muted)", fontSize: 13, marginBottom: 20 }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="btn btn-primary"
          style={{ cursor: "pointer" }}
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      </div>
    </div>
  );
}
