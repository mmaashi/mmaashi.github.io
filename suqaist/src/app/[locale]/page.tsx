import { getMarketSummary, getTopGainers, getTopLosers } from "@/lib/data-sources";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

// Loading skeleton component
function MarketStatusSkeleton() {
  return (
    <div className="bg-[#111827] rounded-lg p-4 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-20 mb-2"></div>
      <div className="h-8 bg-gray-700 rounded w-32"></div>
    </div>
  );
}

function MoversSkeleton() {
  return (
    <div className="bg-[#111827] rounded-lg p-4 animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-24 mb-4"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex justify-between py-2 border-b border-gray-800">
          <div className="h-4 bg-gray-700 rounded w-16"></div>
          <div className="h-4 bg-gray-700 rounded w-12"></div>
        </div>
      ))}
    </div>
  );
}

function NewsSkeleton() {
  return (
    <div className="bg-[#111827] rounded-lg p-4 animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-24 mb-4"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="py-3 border-b border-gray-800">
          <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-24"></div>
        </div>
      ))}
    </div>
  );
}

// Market Status Bar Component
async function MarketStatusBar() {
  try {
    const summary = await getMarketSummary();
    const isPositive = summary.index_change >= 0;

    return (
      <div className="bg-[#111827] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-sm">TASI</span>
            <div className="text-2xl font-bold text-white">
              {summary.index_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className={`text-right ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            <div className="text-lg font-semibold">
              {isPositive ? '+' : ''}{summary.index_change.toFixed(2)}
            </div>
            <div className="text-sm">
              {isPositive ? '+' : ''}{summary.index_change_percent.toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-gray-500">
          <span>Vol: {(summary.total_volume / 1e9).toFixed(2)}B</span>
          <span className="text-[#10B981]">▲ {summary.advancing}</span>
          <span className="text-[#EF4444]">▼ {summary.declining}</span>
          <span>━ {summary.unchanged}</span>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Market status error:", error);
    return (
      <div className="bg-[#111827] rounded-lg p-4">
        <p className="text-gray-400 text-sm">Market data temporarily unavailable</p>
      </div>
    );
  }
}

// Top Movers Component
async function TopMovers() {
  try {
    const [gainers, losers] = await Promise.all([
      getTopGainers(),
      getTopLosers(),
    ]);

    return (
      <div className="grid md:grid-cols-2 gap-4">
        {/* Gainers */}
        <div className="bg-[#111827] rounded-lg p-4">
          <h3 className="text-[#10B981] font-semibold mb-3">Top Gainers</h3>
          <div className="space-y-2">
            {gainers.slice(0, 5).map((stock) => (
              <Link
                key={stock.symbol}
                href={`/stock/${stock.symbol}`}
                className="flex justify-between items-center py-2 border-b border-gray-800 hover:bg-gray-800/50 transition"
              >
                <div>
                  <span className="font-medium text-white">{stock.symbol}</span>
                  <p className="text-xs text-gray-400 truncate max-w-[120px]">{stock.name_en || stock.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[#10B981]">+{stock.change_percent.toFixed(2)}%</span>
                  <p className="text-xs text-gray-400">{stock.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Losers */}
        <div className="bg-[#111827] rounded-lg p-4">
          <h3 className="text-[#EF4444] font-semibold mb-3">Top Losers</h3>
          <div className="space-y-2">
            {losers.slice(0, 5).map((stock) => (
              <Link
                key={stock.symbol}
                href={`/stock/${stock.symbol}`}
                className="flex justify-between items-center py-2 border-b border-gray-800 hover:bg-gray-800/50 transition"
              >
                <div>
                  <span className="font-medium text-white">{stock.symbol}</span>
                  <p className="text-xs text-gray-400 truncate max-w-[120px]">{stock.name_en || stock.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[#EF4444]">{stock.change_percent.toFixed(2)}%</span>
                  <p className="text-xs text-gray-400">{stock.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Movers error:", error);
    return (
      <div className="bg-[#111827] rounded-lg p-4">
        <p className="text-gray-400 text-sm">Movers data temporarily unavailable</p>
      </div>
    );
  }
}

// Latest News Component
async function LatestNews({ locale }: { locale: string }) {
  const supabase = createServiceClient();
  const { data: articles } = await supabase
    .from("news")
    .select("id, title_en, title_ar, source, source_url, published_at")
    .order("published_at", { ascending: false })
    .limit(5);

  return (
    <div className="bg-[#111827] rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-white">Latest News</h3>
        <Link href={`/${locale}/news`} className="text-sm text-[#C8A951] hover:underline">
          View All
        </Link>
      </div>

      {!articles?.length ? (
        <p className="text-gray-500 text-sm text-center py-4">No news available</p>
      ) : (
        <div className="space-y-1">
          {articles.map((a) => {
            const title = locale === "ar" && a.title_ar ? a.title_ar : a.title_en;
            const ago = a.published_at
              ? (() => {
                  const diff = Date.now() - new Date(a.published_at).getTime();
                  const h = Math.floor(diff / 3600000);
                  if (h < 1) return "just now";
                  if (h < 24) return `${h}h ago`;
                  return `${Math.floor(h / 24)}d ago`;
                })()
              : "";
            return (
              <a
                key={a.id}
                href={a.source_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-3 border-b border-gray-800/60 hover:bg-gray-800/30 transition -mx-4 px-4 last:border-b-0"
              >
                <p className="text-sm text-white leading-snug line-clamp-2">{title}</p>
                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  {a.source && <span className="capitalize">{a.source}</span>}
                  {ago && <span>{ago}</span>}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Disclaimer Component
function Disclaimer() {
  return (
    <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
      <p className="text-xs text-gray-500 text-center">
        SŪQAI provides translated market data for informational purposes only. This is not investment advice.
      </p>
    </div>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Market Status */}
      <section className="mb-6">
        <MarketStatusBar />
      </section>

      {/* Top Movers */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-white">Market Movers</h2>
        <TopMovers />
      </section>

      {/* Latest News */}
      <section className="mb-6">
        <LatestNews locale={locale} />
      </section>

      {/* Disclaimer */}
      <Disclaimer />
    </div>
  );
}
