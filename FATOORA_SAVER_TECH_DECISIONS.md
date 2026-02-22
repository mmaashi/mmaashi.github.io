# FATOORA SAVER - TECH STACK DECISIONS & AGENT BUILD INSTRUCTIONS

## ANSWERS TO ALL 11 QUESTIONS

### 1. Frontend Framework
**DECISION: Next.js 14+ with TypeScript**
- Handles frontend + backend in one project
- Server components for better performance
- Built-in API routes for Twilio webhooks
- Perfect for your timeline and team size (just you + AI)

### 2. Component Library
**DECISION: Tailwind CSS + Shadcn/ui**
- Fast to build, looks professional
- Free and open-source
- Perfect for Arabic RTL support
- Shadcn components are customizable (not a black box)

### 3. Deployment
**DECISION: Vercel**
- One-click deployment from GitHub
- Free tier includes serverless functions
- Made for Next.js apps
- Perfect for MVP

### 4. Database Schema
**DECISION: Design from scratch, you provide Supabase URL**
Tables to create in Supabase:

```sql
-- Users (handled by Supabase Auth, but we create a profile table)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Businesses
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  business_name TEXT NOT NULL,
  tax_id TEXT NOT NULL UNIQUE,
  cr_number TEXT NOT NULL UNIQUE,
  address TEXT,
  city TEXT,
  region TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  plan TEXT NOT NULL DEFAULT 'free', -- free | pro | business
  invoice_limit INT DEFAULT 10, -- 10 for free, 100 for pro, unlimited for business
  invoices_this_month INT DEFAULT 0,
  renewed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  invoice_number TEXT NOT NULL,
  uuid TEXT, -- ZATCA UUID (added in Phase 2)
  invoice_hash TEXT, -- ZATCA hash (Phase 2)
  qr_code TEXT, -- ZATCA QR code (Phase 2)
  xml_data TEXT, -- UBL 2.1 XML (Phase 2)
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  issue_date DATE NOT NULL,
  due_date DATE,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft', -- draft | sent | paid | reported | cleared
  payment_status TEXT DEFAULT 'unpaid', -- unpaid | paid
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Invoice Items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- WhatsApp Messages (for tracking)
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  message_type TEXT NOT NULL, -- incoming | outgoing
  from_number TEXT,
  to_number TEXT,
  message_text TEXT,
  invoice_id UUID REFERENCES invoices(id),
  created_at TIMESTAMP DEFAULT now()
);
```

### 5. Supabase Keys
**DECISION: You provide them in .env.local**
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```
Never commit these to GitHub. Use .env.local (ignored in git).

### 6. ZATCA Onboarding
**DECISION: Skip for MVP (Phase 2)**
- For now: Business owner enters Tax ID + CR number manually
- CSR generation: Show "Certificate Onboarding (Coming Soon)" button
- Phase 2: Integrate ZATCA certificate API when you're ready

### 7. CSR Generation
**DECISION: Skip for MVP, placeholder button**
- Show disabled button: "Generate ZATCA Certificate (Coming Soon)"
- Phase 2: Integrate ZATCA SDK or manual CSR upload

### 8. Invoice Format
**DECISION: Start with database + PDF export, add ZATCA XML in Phase 2**
- MVP: Store invoice data in database, generate PDF for download/email
- Phase 2: Add ZATCA UBL 2.1 XML generation using zatca-sdk (npm package available)

### 9. MVP Timeline
**DECISION: 4 weeks**
- **Week 1**: Landing page + Auth (signup/login) + Dashboard skeleton
- **Week 2**: Dashboard complete + Create invoice form + Invoice list
- **Week 3**: PDF export + Email sending + WhatsApp webhook structure
- **Week 4**: Polish + Testing + Deploy to Vercel

### 10. Team
**DECISION: Just you + AI agent, code must be simple**
- All code well-documented and organized
- Clear folder structure
- Reusable components
- Environment setup must be simple: `npm install` → `npm run dev` → done

### 11. Twilio WhatsApp
**DECISION: Build webhook endpoint now, integrate message parsing in Phase 2**
- API route: `/api/whatsapp/webhook` (receives Twilio messages)
- For MVP: Log messages, show "Message received" in dashboard
- Phase 2: Parse natural language → generate invoice → send QR code back

---

## BUILD INSTRUCTIONS FOR AGENT

### PHASE 1: SETUP (Day 1)

1. **Initialize Next.js project**
   ```bash
   npx create-next-app@latest fatoora-saver --typescript --tailwind --eslint
   cd fatoora-saver
   ```

2. **Install dependencies**
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs shadcn-ui zustand axios
   ```

3. **Setup folder structure**
   ```
   app/
   ├── (auth)/
   │   ├── signup/
   │   ├── login/
   │   └── forgot-password/
   ├── (dashboard)/
   │   ├── dashboard/
   │   ├── invoices/
   │   ├── settings/
   │   └── profile/
   ├── layout.tsx
   └── page.tsx (landing)
   
   components/
   ├── ui/ (shadcn components)
   ├── navbar/
   ├── footer/
   └── invoice-form/
   
   lib/
   ├── supabase.ts
   ├── utils.ts
   └── constants.ts
   
   api/
   ├── auth/
   ├── invoices/
   └── whatsapp/
   
   public/
   └── images/
   ```

4. **Create .env.local** (Momo provides Supabase keys later)
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### PHASE 2: LANDING PAGE (Days 1-2)

Build (in order):
1. Navbar (logo, language toggle AR/EN, CTA button)
2. Hero section (headline: "Create ZATCA invoices through WhatsApp")
3. How it works (4 steps with icons)
4. Pricing plans section (Free, Pro, Business)
5. Testimonials (placeholder)
6. FAQ section
7. Footer with CTA

### PHASE 3: AUTH FLOW (Days 2-3)

1. Sign up page (Supabase Auth)
   - Email, password, business name, tax ID, CR number
   - Create user_profiles + businesses table records
2. Login page (Supabase Auth)
3. Forgot password (Supabase built-in)
4. Protected routes (require auth)

### PHASE 4: DASHBOARD (Days 3-4)

1. Dashboard layout (sidebar navigation)
2. Overview cards (total invoices, revenue this month, pending)
3. Invoice list (with search/filter)
4. Business settings page
5. Subscription management (show current plan, upgrade buttons)

### PHASE 5: INVOICE MANAGEMENT (Days 4-5)

1. Create invoice form (customer name, items, VAT calculation)
2. Invoice detail page
3. PDF export (use jspdf or pdfkit)
4. Email sending structure (sendgrid placeholder)

### PHASE 6: WHATSAPP WEBHOOK (Days 5-6)

1. `/api/whatsapp/webhook` endpoint (POST)
2. Receive Twilio messages, store in whatsapp_messages table
3. Send confirmation back to Twilio
4. Dashboard shows "Messages" section

### PHASE 7: TESTING & DEPLOY (Days 6-7)

1. Test all auth flows
2. Test invoice creation/viewing
3. Test responsive design (mobile first)
4. Deploy to Vercel
5. Test live version

---

## DESIGN TOKENS

### Colors
```
PRIMARY_BLUE: #1E3A5F
TEAL: #2EC4B6
BACKGROUND: #FFFFFF
TEXT_DARK: #1F2937
TEXT_LIGHT: #6B7280
BORDER: #E5E7EB
SUCCESS: #10B981
ERROR: #EF4444
WARNING: #F59E0B
```

### Arabic Fonts (Google Fonts)
```
Body: "Cairo" or "Tajawal"
Heading: "IBM Plex Arabic" or "Cairo Bold"
Mono: "IBM Plex Mono"
```

### Spacing (Tailwind)
Use default Tailwind scale (4px base unit)

### Typography
- Heading 1: 32px, bold, Arabic
- Heading 2: 24px, bold
- Body: 16px, regular
- Small: 14px, regular

---

## READY TO BUILD

Echo is now ready to:
1. Create the Next.js project
2. Push to GitHub
3. Build page by page
4. Deploy to Vercel

**Next step:** Give Echo your Supabase URL and keys (via environment variables, never in chat), and he'll start building.

**Timeline:** 1-2 weeks to MVP on Vercel, fully functional.
