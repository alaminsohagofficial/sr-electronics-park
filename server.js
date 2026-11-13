```javascript
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/sae_pos',
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      service: 'S.R. Electronics Park - Unified Treasury & POS API',
      powered_by: 'Gemini',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// 1. Accounts
app.get('/api/accounts', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accounts ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/accounts error:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

app.post('/api/accounts', async (req, res) => {
  const { account_name, account_type, account_number, bank_name, deal_id, balance = 0, added_by } = req.body;
  if (!account_name || !account_type || !account_number) {
    return res.status(400).json({ error: 'account_name, account_type, and account_number are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO accounts (account_name, account_type, account_number, bank_name, deal_id, balance, added_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [account_name, account_type, account_number, bank_name || null, deal_id || null, Number(balance), added_by || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/accounts error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// 2. Transactions (Atomic Ledger Update)
app.get('/api/transactions', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  try {
    const result = await pool.query(
      `SELECT t.*, a.account_name, a.account_number
       FROM transactions t
       JOIN accounts a ON a.id = t.account_id
       ORDER BY t.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', async (req, res) => {
  const { account_id, transaction_type, amount, payment_method, reference_note, created_by } = req.body;
  const numericAmount = Number(amount);
  const validTypes = ['Deposit', 'Withdraw', 'Transfer', 'Settlement'];

  if (!account_id || !validTypes.includes(transaction_type) || !Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({
      error: 'Valid account_id, transaction_type (Deposit|Withdraw|Transfer|Settlement), and positive amount are required',
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const accRes = await client.query('SELECT id, balance FROM accounts WHERE id = $1 FOR UPDATE', [account_id]);
    if (accRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Account not found' });
    }

    const currentBalance = Number(accRes.rows[0].balance);
    const isCredit = transaction_type === 'Deposit' || transaction_type === 'Settlement';
    if (!isCredit && currentBalance < numericAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient account balance' });
    }

    const updatedBalance = isCredit ? currentBalance + numericAmount : currentBalance - numericAmount;
    await client.query('UPDATE accounts SET balance = $1 WHERE id = $2', [updatedBalance, account_id]);

    const txRes = await client.query(
      `INSERT INTO transactions (account_id, transaction_type, amount, payment_method, reference_note, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [account_id, transaction_type, numericAmount, payment_method || 'NPSB', reference_note || null, created_by || null]
    );

    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      message: 'Transaction completed securely.',
      transaction: txRes.rows[0],
      new_balance: updatedBalance,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/transactions error:', err);
    res.status(500).json({ error: 'Transaction failed and was rolled back.' });
  } finally {
    client.release();
  }
});

// 3. Inventory
app.get('/api/inventory', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory ORDER BY item_name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/inventory error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

app.post('/api/inventory', async (req, res) => {
  const { sku, item_name, brand, category, stock_quantity = 0, reorder_level = 2, unit_price, warranty_months = 12 } = req.body;
  if (!item_name || unit_price === undefined) {
    return res.status(400).json({ error: 'item_name and unit_price are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO inventory (sku, item_name, brand, category, stock_quantity, reorder_level, unit_price, warranty_months)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [sku || null, item_name, brand || null, category || null, Number(stock_quantity), Number(reorder_level), Number(unit_price), Number(warranty_months)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/inventory error:', err);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// 4. Customers
app.get('/api/customers', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/customers error:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', async (req, res) => {
  const { customer_name, phone, email, address, due_amount = 0 } = req.body;
  if (!customer_name || !phone) {
    return res.status(400).json({ error: 'customer_name and phone are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO customers (customer_name, phone, email, address, due_amount)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [customer_name, phone, email || null, address || null, Number(due_amount)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/customers error:', err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.listen(PORT, () => {
  console.log(`S.R. Electronics Park API running on port ${PORT}`);
});
```
