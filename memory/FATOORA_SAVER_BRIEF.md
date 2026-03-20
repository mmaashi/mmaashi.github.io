# PROJECT: Fatoora Saver
## Saudi Arabian E-Invoicing SaaS Platform

### What It Is
WhatsApp chatbot + website for small/medium businesses to generate ZATCA-compliant electronic invoices (Fatoora) without complex software.

### Core Problem Solved
Saudi businesses overwhelmed by ZATCA e-invoicing requirements (Phase 2 — Integration Phase). Fatoora Saver makes it as simple as sending a WhatsApp message.

### User Journey
1. Sign up on website (business details, Tax ID, CR number)
2. Connect WhatsApp via QR code
3. Message bot: "Invoice for Ahmed, 500 SAR for consulting"
4. Bot generates ZATCA-compliant invoice (QR, XML, digital signature, UUID)
5. Auto-reported/cleared through ZATCA API
6. Customer gets invoice via WhatsApp/email/link
7. Owner views all invoices on dashboard

---

## WEBSITE STRUCTURE

### Pages Required
- **Landing Page**: Hero, how-it-works (3-4 steps), pricing plans, testimonials, FAQ, CTA
- **Pricing Page**: Free (10/month), Pro (100/month), Business (unlimited) — all in SAR
- **Sign Up**: Business name, Tax ID, CR number, owner details, password, T&C
- **Login**: Email/password + forgot password flow
- **Dashboard**: Overview (totals, revenue, pending), invoice list, create form, settings, subscription mgmt
- **About Us**: Story, mission, vision, team placeholder
- **Contact/Support**: Form, WhatsApp link, email, phone

### Design
- **Primary Colors**: Deep blue (#1E3A5F), Teal (#2EC4B6)
- **Style**: Clean, modern, trustworthy fintech look
- **Typography**: Arabic-first (Cairo, Tajawal, or IBM Plex Arabic from Google Fonts)
- **Language**: Bilingual — Arabic (RTL primary) + English
- **Responsive**: Mobile-first (Saudi users on mobile)

---

## BACKEND & DATABASE (Supabase)

### Tables Needed
- `users` (email, password, profile)
- `businesses` (owner_id, business_name, tax_id, cr_number, address)
- `invoices` (business_id, uuid, hash, qr_code, xml, status, amount, issue_date)
- `invoice_items` (invoice_id, description, qty, unit_price, amount)
- `subscriptions` (business_id, plan, renews_at, invoice_count)

### Auth
- Supabase Auth (email/password + OTP phone support)

### Payments
- Frontend structure only for HyperPay/Moyasar (no live processing yet)

---

## ZATCA COMPLIANCE CONTEXT

### Invoice Requirements
- **Format**: UBL 2.1 XML
- **Fields**: UUID, invoice hash, QR code (Base64 TLV encoded), digital signature
- **Types**: 
  - Simplified invoices (B2C, reported)
  - Standard invoices (B2B, clearance required)
- **VAT**: 15% (Saudi Arabia)
- **API Communication**: Report/clearance through ZATCA endpoints
- **CSR Generation**: Part of onboarding (certificate signing request)

---

## INTEGRATIONS

### WhatsApp (Twilio)
- **Sandbox**: Already set up
- **Webhook**: Receive incoming messages
- **NLP Parsing**: Extract invoice details from natural language
- **Responses**: Send formatted invoice confirmations

### Payments (Structure Only)
- HyperPay or Moyasar integration (UI/flow, not live processing)

---

## OUT OF SCOPE (FOR NOW)
- Mobile app (iOS/Android)
- Full ZATCA API integration code
- Actual payment processing

---

## MOMO'S CONTEXT
- Already has Supabase project set up
- Already has Twilio account + WhatsApp sandbox
- Wants complete, deployable website
- First step: Build the website + structure
