"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Company {
  id: string;
  ticker: string;
  name_en: string;
  name_ar: string;
  sector: string;
  market: string;
  is_shariah_compliant: boolean;
  price: number | null;
  open: number | null;
  volume: number | null;
  change_pct: number | null;
}

type SortKey = "name" | "price" | "change" | "volume";
type SortDir = "asc" | "desc";

export default function ScreenerTable({
  companies,
  sectors,
  locale,
}: {
  companies: Company[];
  sectors: string[];
  locale: string;
}) {
  const [sectorFilter, setSectorFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (col: SortKey) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let result = [...companies];

    if (sectorFilter) result = result.filter((c) => c.sector === sectorFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.ticker.toLowerCase().includes(q) ||
          c.name_en.toLowerCase().includes(q) ||
          c.name_ar.includes(q)
      );
    }

    result.sort((a, b) => {
      let diff = 0;
      if (sortBy === "name") diff = a.name_en.localeCompare(b.name_en);
      else if (sortBy === "price") diff = (a.price ?? -Infinity) - (b.price ?? -Infinity);
      else if (sortBy === "change") diff = (a.change_pct ?? -Infinity) - (b.change_pct ?? -Infinity);
      else if (sortBy === "volume") diff = (a.volume ?? -Infinity) - (b.volume ?? -Infinity);
      return sortDir === "asc" ? diff : -diff;
    });

    return result;
  }, [companies, sectorFilter, search, sortBy, sortDir]);

  const SortBtn = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      onClick={() => handleSort(col)}
      className="text-xs font-medium p-3 cursor-pointer select-none hover:text-white transition text-gray-400"
    >
      <span className="flex items-center gap-1 justify-end">
        {label}
        {sortBy === col ? (
          <span className="text-[#C8A951]">{sortDir === "asc" ? "↑" : "↓"}</span>
        ) : (
          <span className="text-gray-700">↕</span>
        )}
      </span>
    </th>
  );

  return (
    <>
      {/* Filter Bar */}
      <div className="bg-[#111827] rounded-xl p-4 mb-4 border border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search ticker or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-[#C8A951] focus:outline-none transition"
            />
          </div>
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#C8A951] focus:outline-none transition"
          >
            <option value="">All Sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-[#C8A951]"></span>
            {filtered.length} of {companies.length} companies
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111827] rounded-xl overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0D1626] border-b border-gray-800">
              <tr>
                <th
                  onClick={() => handleSort("name")}
                  className="text-left text-xs font-medium p-3 cursor-pointer select-none hover:text-white transition text-gray-400"
                >
                  <span className="flex items-center gap-1">
                    Company
                    {sortBy === "name" ? (
                      <span className="text-[#C8A951]">{sortDir === "asc" ? "↑" : "↓"}</span>
                    ) : (
                      <span className="text-gray-700">↕</span>
                    )}
                  </span>
                </th>
                <th className="text-left text-xs font-medium p-3 text-gray-400">Sector</th>
                <SortBtn col="price" label="Price" />
                <SortBtn col="change" label="Change %" />
                <SortBtn col="volume" label="Volume" />
                <th className="text-center text-xs font-medium p-3 text-gray-400">Shariah</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((company, i) => {
                const isPositive = (company.change_pct ?? 0) >= 0;
                return (
                  <tr
                    key={company.ticker}
                    className="border-t border-gray-800/60 hover:bg-gray-800/40 transition"
                  >
                    <td className="p-3">
                      <Link href={`/${locale}/stock/${company.ticker}`} className="block group">
                        <span className="text-[#C8A951] font-bold text-sm group-hover:underline">
                          {company.ticker}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                          {locale === "ar" ? company.name_ar : company.name_en}
                        </p>
                      </Link>
                    </td>
                    <td className="p-3">
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                        {company.sector}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-white font-semibold text-sm">
                        {company.price != null ? `SAR ${company.price.toFixed(2)}` : "--"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {company.change_pct != null ? (
                        <span className={`text-sm font-medium ${isPositive ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                          {isPositive ? "+" : ""}{company.change_pct.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-gray-600 text-sm">--</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-gray-400 text-sm">
                      {company.volume != null
                        ? company.volume >= 1e6
                          ? `${(company.volume / 1e6).toFixed(1)}M`
                          : `${(company.volume / 1e3).toFixed(0)}K`
                        : "--"}
                    </td>
                    <td className="p-3 text-center">
                      {company.is_shariah_compliant ? (
                        <span className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                          ✓ Halal
                        </span>
                      ) : (
                        <span className="text-gray-700 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">No companies match your search</p>
          </div>
        )}
      </div>
    </>
  );
}
