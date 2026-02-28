/**
 * Supabase Database types for SŪQAI
 * Maps to the full schema in src/lib/db/setup.sql
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type MarketType = 'main' | 'nomu'
export type AlertKind = 'price_above' | 'price_below' | 'sentiment' | 'filing' | 'dividend' | 'ownership'
export type SubscriptionTier = 'free' | 'pro' | 'institutional'
export type VoteType = 'bullish' | 'bearish' | 'neutral'
export type IpoStatus = 'upcoming' | 'active' | 'completed' | 'cancelled'
export type Language = 'ar' | 'en' | 'zh'

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          ticker: string
          symbol: string
          name_ar: string
          name_en: string
          name_zh: string | null
          sector: string
          sub_sector: string | null
          market: MarketType
          is_shariah_compliant: boolean
          vision_2030_score: number | null
          logo_url: string | null
          description_ar: string | null
          description_en: string | null
          description_zh: string | null
          website_url: string | null
          employee_count: number | null
          founded_year: number | null
          ceo_name_ar: string | null
          ceo_name_en: string | null
          government_contracts: string[] | null
          mega_projects: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticker: string
          symbol: string
          name_ar: string
          name_en: string
          name_zh?: string | null
          sector: string
          sub_sector?: string | null
          market?: MarketType
          is_shariah_compliant?: boolean
          vision_2030_score?: number | null
          logo_url?: string | null
          description_ar?: string | null
          description_en?: string | null
          description_zh?: string | null
          website_url?: string | null
          employee_count?: number | null
          founded_year?: number | null
          ceo_name_ar?: string | null
          ceo_name_en?: string | null
          government_contracts?: string[] | null
          mega_projects?: string[] | null
        }
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
        Relationships: []
      }
      stock_prices: {
        Row: {
          id: number
          company_id: string
          date: string
          open: number
          high: number
          low: number
          close: number
          volume: number
          adjusted_close: number
          created_at: string
        }
        Insert: {
          company_id: string
          date: string
          open?: number
          high?: number
          low?: number
          close?: number
          volume?: number
          adjusted_close?: number
        }
        Update: Partial<Database['public']['Tables']['stock_prices']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'stock_prices_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          }
        ]
      }
      financials: {
        Row: {
          id: string
          company_id: string
          period: string
          year: number
          revenue: number | null
          net_income: number | null
          total_assets: number | null
          total_liabilities: number | null
          earnings_per_share: number | null
          book_value_per_share: number | null
          operating_cash_flow: number | null
          free_cash_flow: number | null
          debt_to_equity: number | null
          current_ratio: number | null
          created_at: string
        }
        Insert: {
          company_id: string
          period: string
          year: number
          revenue?: number | null
          net_income?: number | null
          total_assets?: number | null
          total_liabilities?: number | null
          earnings_per_share?: number | null
          book_value_per_share?: number | null
          operating_cash_flow?: number | null
          free_cash_flow?: number | null
          debt_to_equity?: number | null
          current_ratio?: number | null
        }
        Update: Partial<Database['public']['Tables']['financials']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'financials_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          }
        ]
      }
      dividends: {
        Row: {
          id: string
          company_id: string
          ex_date: string
          pay_date: string | null
          record_date: string | null
          year: number | null
          amount_per_share: number
          currency: string
          created_at: string
        }
        Insert: {
          company_id: string
          ex_date: string
          pay_date?: string | null
          record_date?: string | null
          year?: number | null
          amount_per_share: number
          currency?: string
        }
        Update: Partial<Database['public']['Tables']['dividends']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'dividends_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          }
        ]
      }
      ownership: {
        Row: {
          id: string
          company_id: string
          date: string
          foreign_percent: number | null
          institutional_percent: number | null
          government_percent: number | null
          retail_percent: number | null
          created_at: string
        }
        Insert: {
          company_id: string
          date: string
          foreign_percent?: number | null
          institutional_percent?: number | null
          government_percent?: number | null
          retail_percent?: number | null
        }
        Update: Partial<Database['public']['Tables']['ownership']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'ownership_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          }
        ]
      }
      news: {
        Row: {
          id: string
          company_id: string | null
          title_ar: string | null
          title_en: string | null
          title_zh: string | null
          body_ar: string | null
          body_en: string | null
          body_zh: string | null
          source: string
          source_url: string
          sentiment_score: number | null
          published_at: string
          created_at: string
        }
        Insert: {
          company_id?: string | null
          title_ar?: string | null
          title_en?: string | null
          title_zh?: string | null
          body_ar?: string | null
          body_en?: string | null
          body_zh?: string | null
          source: string
          source_url: string
          sentiment_score?: number | null
          published_at: string
        }
        Update: Partial<Database['public']['Tables']['news']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'news_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          }
        ]
      }
      translations_cache: {
        Row: {
          id: string
          source_text_hash: string
          source_language: string
          target_language: string
          translated_text: string
          model_used: string
          created_at: string
        }
        Insert: {
          source_text_hash: string
          source_language?: string
          target_language: string
          translated_text: string
          model_used?: string
        }
        Update: Partial<Database['public']['Tables']['translations_cache']['Insert']>
        Relationships: []
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          messages: Json
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          messages?: Json
          language?: string
        }
        Update: Partial<Database['public']['Tables']['chat_sessions']['Insert']>
        Relationships: []
      }
      community_votes: {
        Row: {
          id: string
          user_id: string
          company_id: string
          vote: VoteType
          voted_at: string
        }
        Insert: {
          user_id: string
          company_id: string
          vote: VoteType
        }
        Update: Partial<Database['public']['Tables']['community_votes']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'community_votes_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          }
        ]
      }
      ipos: {
        Row: {
          id: string
          company_name_ar: string
          company_name_en: string | null
          company_name_zh: string | null
          sector: string | null
          expected_date: string | null
          subscription_start: string | null
          subscription_end: string | null
          price_range_low: number | null
          price_range_high: number | null
          status: IpoStatus
          details_ar: string | null
          details_en: string | null
          details_zh: string | null
          source_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          company_name_ar: string
          company_name_en?: string | null
          company_name_zh?: string | null
          sector?: string | null
          expected_date?: string | null
          subscription_start?: string | null
          subscription_end?: string | null
          price_range_low?: number | null
          price_range_high?: number | null
          status?: IpoStatus
          details_ar?: string | null
          details_en?: string | null
          details_zh?: string | null
          source_url?: string | null
        }
        Update: Partial<Database['public']['Tables']['ipos']['Insert']>
        Relationships: []
      }
      portfolios: {
        Row: {
          id: string
          user_id: string
          name: string
          is_watchlist: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          is_watchlist?: boolean
        }
        Update: Partial<Database['public']['Tables']['portfolios']['Insert']>
        Relationships: []
      }
      portfolio_holdings: {
        Row: {
          id: string
          portfolio_id: string
          company_id: string
          shares: number
          avg_cost: number
          added_at: string
        }
        Insert: {
          portfolio_id: string
          company_id: string
          shares?: number
          avg_cost?: number
        }
        Update: Partial<Database['public']['Tables']['portfolio_holdings']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'portfolio_holdings_portfolio_id_fkey'
            columns: ['portfolio_id']
            isOneToOne: false
            referencedRelation: 'portfolios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'portfolio_holdings_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          }
        ]
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          company_id: string
          type: AlertKind
          threshold: number | null
          is_active: boolean
          last_triggered_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          company_id: string
          type: AlertKind
          threshold?: number | null
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'alerts_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          preferred_language: Language
          subscription_tier: SubscriptionTier
          subscription_expires_at: string | null
          timezone: string
          telegram_chat_id: string | null
          whatsapp_number: string | null
          morning_brief_enabled: boolean
          notification_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          preferred_language?: Language
          subscription_tier?: SubscriptionTier
          timezone?: string
          morning_brief_enabled?: boolean
          notification_preferences?: Json
        }
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      market_type: MarketType
      alert_type: AlertKind
      subscription_tier: SubscriptionTier
      vote_type: VoteType
      ipo_status: IpoStatus
    }
    CompositeTypes: Record<string, never>
  }
}

// ─── Convenience type aliases ────────────────────────────────

export type Company = Database['public']['Tables']['companies']['Row']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type StockPrice = Database['public']['Tables']['stock_prices']['Row']
export type StockPriceInsert = Database['public']['Tables']['stock_prices']['Insert']
export type Financial = Database['public']['Tables']['financials']['Row']
export type Dividend = Database['public']['Tables']['dividends']['Row']
export type Ownership = Database['public']['Tables']['ownership']['Row']
export type NewsArticle = Database['public']['Tables']['news']['Row']
export type NewsInsert = Database['public']['Tables']['news']['Insert']
export type TranslationCache = Database['public']['Tables']['translations_cache']['Row']
export type ChatSession = Database['public']['Tables']['chat_sessions']['Row']
export type CommunityVote = Database['public']['Tables']['community_votes']['Row']
export type Ipo = Database['public']['Tables']['ipos']['Row']
export type Portfolio = Database['public']['Tables']['portfolios']['Row']
export type PortfolioHolding = Database['public']['Tables']['portfolio_holdings']['Row']
export type Alert = Database['public']['Tables']['alerts']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
