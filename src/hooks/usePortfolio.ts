"use client";

import { useState, useEffect, useCallback } from "react";

/* ── Types ── */
export interface PortfolioHolding {
  ticker: string;
  companyId?: string;
  companyName?: string;
  quantity: number;
  averageCost: number | null; // null = user doesn't know
  purchaseDate?: string; // ISO date
}

export interface PortfolioState {
  holdings: PortfolioHolding[];
  updatedAt: string;
}

const STORAGE_KEY = "suqai_portfolio";
const API_SYNCED_KEY = "suqai_portfolio_synced";

/* ── Helpers ── */
function loadFromStorage(): PortfolioState {
  if (typeof window === "undefined") return { holdings: [], updatedAt: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PortfolioState;
  } catch { /* corrupt data */ }
  return { holdings: [], updatedAt: "" };
}

function saveToStorage(state: PortfolioState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* full storage */ }
}

/* ── Sync from API on first load ── */
async function syncFromApi(): Promise<PortfolioHolding[] | null> {
  try {
    const res = await fetch("/api/portfolio");
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.holdings?.length) return null;
    return data.holdings.map((h: Record<string, unknown>) => ({
      ticker: h.ticker as string,
      companyId: (h.company_id as string) || undefined,
      companyName: undefined,
      quantity: Number(h.quantity || h.shares || 0),
      averageCost: h.average_cost != null ? Number(h.average_cost) : h.avg_cost != null ? Number(h.avg_cost) : null,
      purchaseDate: (h.purchase_date as string) || undefined,
    }));
  } catch {
    return null;
  }
}

/* ── Hook ── */
export function usePortfolio() {
  const [state, setState] = useState<PortfolioState>({ holdings: [], updatedAt: "" });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount, then try API sync
  useEffect(() => {
    const local = loadFromStorage();
    setState(local);
    setIsLoaded(true);

    // If never synced from API, try once
    const synced = localStorage.getItem(API_SYNCED_KEY);
    if (!synced && local.holdings.length === 0) {
      syncFromApi().then((apiHoldings) => {
        if (apiHoldings && apiHoldings.length > 0) {
          const newState: PortfolioState = {
            holdings: apiHoldings,
            updatedAt: new Date().toISOString(),
          };
          setState(newState);
          saveToStorage(newState);
          localStorage.setItem(API_SYNCED_KEY, "1");
        }
      });
    }
  }, []);

  const getHolding = useCallback(
    (ticker: string): PortfolioHolding | undefined => {
      return state.holdings.find((h) => h.ticker === ticker);
    },
    [state.holdings]
  );

  const hasHolding = useCallback(
    (ticker: string): boolean => {
      return state.holdings.some((h) => h.ticker === ticker);
    },
    [state.holdings]
  );

  const addHolding = useCallback(
    (holding: PortfolioHolding) => {
      setState((prev) => {
        const filtered = prev.holdings.filter((h) => h.ticker !== holding.ticker);
        const newState: PortfolioState = {
          holdings: [...filtered, holding],
          updatedAt: new Date().toISOString(),
        };
        saveToStorage(newState);
        // Fire-and-forget API save
        fetch("/api/portfolio/holdings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticker: holding.ticker,
            company_id: holding.companyId || null,
            quantity: holding.quantity,
            average_cost: holding.averageCost,
            purchase_date: holding.purchaseDate || null,
          }),
        }).catch(() => {});
        return newState;
      });
    },
    []
  );

  const updateHolding = useCallback(
    (ticker: string, updates: Partial<PortfolioHolding>) => {
      setState((prev) => {
        const newHoldings = prev.holdings.map((h) =>
          h.ticker === ticker ? { ...h, ...updates } : h
        );
        const newState: PortfolioState = {
          holdings: newHoldings,
          updatedAt: new Date().toISOString(),
        };
        saveToStorage(newState);
        return newState;
      });
    },
    []
  );

  const removeHolding = useCallback(
    (ticker: string) => {
      setState((prev) => {
        const newState: PortfolioState = {
          holdings: prev.holdings.filter((h) => h.ticker !== ticker),
          updatedAt: new Date().toISOString(),
        };
        saveToStorage(newState);
        return newState;
      });
    },
    []
  );

  return {
    holdings: state.holdings,
    isLoaded,
    holdingsCount: state.holdings.length,
    getHolding,
    hasHolding,
    addHolding,
    updateHolding,
    removeHolding,
  };
}
