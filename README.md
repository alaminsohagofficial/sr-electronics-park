# S.R. Electronics Park — Unified Treasury & ERP Hub
**S.R. Electronics Park** *(An Enterprise of Salsabilah Amin Limited)* — Central Treasury Dashboard, Point-of-Sale (POS) Banking Tracker, Inventory & Customer Ledger, and Automated SAP ECC 6.0 Sync Hub for Dealer DEAL002905.
**Powered by Gemini**
## Repository Structure
| File / Path | Role | Details |
|---|---|---|
| index.html | Unified Dashboard UI | Dark-themed responsive treasury & POS dashboard with Salsabilah branding, live server.js API sync, and standalone fallback |
| App.js | React Frontend Component | Fetches live account records from GET http://localhost:5000/api/accounts and renders account cards |
| server.js | Node.js / Express Backend | REST API server with PostgreSQL pool, input validation, and atomic transaction handling |
| schema.sql | PostgreSQL Database Schema | Defines accounts, inventory, customers, transactions, sales_invoices, sales_invoice_items, triggers, and indexes |
| seed.sql | Default Seed Data | Idempotent (ON CONFLICT DO NOTHING) seed script for the 7 corporate & local banking/POS accounts |
| api_sync.js | Ledger Verification Script | Verifies 7 settled capital inflow transactions (1,920,000.00 BDT) against Dutch-Bangla Bank PLC / Bangladesh Bank NPSB Switch |
| package.json | Node.js Manifest | Defines express, cors, pg dependencies and start, sync, check scripts |
| .github/workflows/ | GitHub Actions CI | Automated Node.js & PostgreSQL CI verification pipeline |
## Tech Stack
 * **Frontend:** HTML5, CSS3 (Grid & CSS Variables), Vanilla JavaScript (index.html), React (App.js)
 * **Backend:** Node.js, Express, CORS (server.js)
 * **Database:** PostgreSQL (schema.sql, seed.sql)
 * **Integration / Sync:** Automated DBBL & Bangladesh Bank NPSB Switch ledger verification (api_sync.js)
## Database Schema (schema.sql & seed.sql)
The PostgreSQL schema includes an automatic set_updated_at() trigger, strict CHECK constraints, performance indexes, and six core tables:
 1. **accounts** — Corporate treasury and local banking/POS accounts (id, account_name, account_type, account_number, bank_name, deal_id, balance, status, added_by, created_at, updated_at).
 2. **inventory** — Showroom stock, SKUs, brands, pricing, reorder levels, and warranty tracking (id, sku, item_name, brand, category, stock_quantity, reorder_level, unit_price, warranty_months, updated_at).
 3. **customers** — Customer directory and due ledger (id, customer_name, phone, email, address, due_amount, created_at, updated_at).
 4. **transactions** — Atomic ledger movements linked to accounts(id) (id, account_id, transaction_type, amount, payment_method, status, reference_note, created_by, created_at).
 5. **sales_invoices** — POS sales headers linked to customers(id) and accounts(id) (id, invoice_number, customer_id, account_id, subtotal, discount, total_amount, paid_amount, payment_status, created_at).
 6. **sales_invoice_items** — Line items per invoice with computed line_total (id, invoice_id, inventory_id, quantity, unit_price, line_total).
## API Endpoints (server.js)
The Express server runs on process.env.PORT (default: 5000).
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/health | Verifies API and PostgreSQL connectivity |
| GET | /api/accounts | Lists all accounts ordered by id |
| POST | /api/accounts | Creates a new account (account_name, account_type, account_number, optional bank_name, deal_id, balance, added_by) |
| GET | /api/transactions | Lists recent transactions joined with account details (?limit=50, max 200) |
| POST | /api/transactions | Executes an atomic (BEGIN / COMMIT / ROLLBACK) transaction (Deposit, Withdraw, Transfer, Settlement) with balance validation |
| GET | /api/inventory | Lists all inventory items ordered by item_name |
| POST | /api/inventory | Adds a new inventory item (item_name, unit_price, optional sku, brand, category, stock_quantity, reorder_level, warranty_months) |
| GET | /api/customers | Lists all customers ordered by created_at DESC |
| POST | /api/customers | Registers a new customer (customer_name, phone, optional email, address, due_amount) |
### Environment Variables
| Variable | Default | Description |
|---|---|---|
| PORT | 5000 | Port for the Express API server |
| DATABASE_URL | postgresql://postgres:password@localhost:5432/sae_pos | PostgreSQL connection string |
## Local Setup & Usage
### 1. Initialize PostgreSQL Database
Create the sae_pos database, apply schema.sql, and load the default accounts from seed.sql:
```bash
psql -U postgres -d sae_pos -f schema.sql
psql -U postgres -d sae_pos -f seed.sql

```
### 2. Install Dependencies & Start Backend
```bash
npm install
export PORT=5000
export DATABASE_URL="postgresql://postgres:password@localhost:5432/sae_pos"
npm start

```
### 3. Verify Syntax & Ledger Sync
```bash
npm run check
npm run sync

```
npm run sync executes api_sync.js to verify the 7 settled transactions (2026-07-06 to 2026-07-12) against the 1,920,000.00 BDT disputed pool for Dealer DEAL002905 (SR Electronics Park).
### 4. Open Dashboard
 * Open index.html in a browser for the unified treasury dashboard (automatically connects to http://localhost:5000 when server.js is running, or falls back to standalone mode).
 * Integrate App.js into a React app to render live account cards from http://localhost:5000/api/accounts.
*Powered by Gemini · Salsabilah Enterprise ERP Engine & SAP ECC 6.0 Integration Hub*
