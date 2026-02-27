"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";

export default function StockError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const isAr = locale === "ar";

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
          {isAr ? "حدث خطأ" : "Something went wrong"}
        </h1>
        <p style={{ color: "var(--c-muted)", fontSize: 13, marginBottom: 4 }}>
          {isAr
            ? "تعذّر تحميل صفحة السهم. قد تكون بيانات السوق غير متاحة مؤقتاً."
            : "Could not load this stock page. The market data may be temporarily unavailable."}
        </p>
        {error.digest && (
          <p style={{ color: "var(--c-dim)", fontSize: 11, marginBottom: 20 }}>
            Error: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={reset}
            className="btn btn-primary"
            style={{ cursor: "pointer" }}
          >
            <RefreshCw size={14} />
            {isAr ? "إعادة المحاولة" : "Try Again"}
          </button>
          <Link
            href={`/${locale}/screener`}
            className="btn btn-ghost"
            style={{ textDecoration: "none" }}
          >
            <ArrowLeft size={14} />
            {isAr ? "العودة للتصفية" : "Back to Screener"}
          </Link>
        </div>
      </div>
    </div>
  );
}
