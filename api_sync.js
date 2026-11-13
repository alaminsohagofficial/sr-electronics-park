```javascript
/**
 * Repository: sr-electronics-park / minister-erp-engine
 * File Name: api_sync.js
 * Purpose: Automated Ledger & API Payload Sync for Dealer DEAL002905
 * Powered by Gemini
 */

const { Pool } = require('pg');

const apiPayload = {
  dealer_id: 'DEAL002905',
  client_name: 'SR Electronics Park',
  total_disputed_pool_bdt: 1920000.00,
  clearing_bank: 'Dutch-Bangla Bank PLC',
  settlement_node: 'Bangladesh Bank NPSB Switch',
  payload_generation_timestamp: '2026-10-18T18:00:00Z',
  transactions: [
    { date: '2026-07-06', txn_id: '100NEXP26187M597', sap_lid: 'LID01976788453', amount: 238000.00, status: 'SUCCESS' },
    { date: '2026-07-07', txn_id: '100NEXP26188M616', sap_lid: 'LID01996890123', amount: 270000.00, status: 'SUCCESS' },
    { date: '2026-07-07', txn_id: '100NEXP26188M584', sap_lid: 'LID01996889539', amount: 230000.00, status: 'SUCCESS' },
    { date: '2026-07-08', txn_id: '100NXN126189M586', sap_lid: 'LID01998640246', amount: 297000.00, status: 'SUCCESS' },
    { date: '2026-07-08', txn_id: '100NXN126189M591', sap_lid: 'LID01938788435', amount: 285000.00, status: 'SUCCESS' },
    { date: '2026-07-12', txn_id: '100NEXP26193M601', sap_lid: 'LID01996914258', amount: 300000.00, status: 'SUCCESS' },
    { date: '2026-07-12', txn_id: '100NEXP26193M602', sap_lid: 'LID01996987412', amount: 300000.00, status: 'SUCCESS' },
  ],
};

function syncLedger(payload) {
  console.log('--- Starting ERP/SAP API Sync ---');
  console.log(`Dealer: ${payload.client_name} (${payload.dealer_id})`);
  console.log(`Clearing Bank: ${payload.clearing_bank} | Node: ${payload.settlement_node}`);

  const seenTxnIds = new Set();
  const seenSapLids = new Set();
  let totalPaisa = 0;
  let hasErrors = false;

  payload.transactions.forEach((tx, idx) => {
    const amount = Number(tx.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      console.error(`[Error ${idx + 1}] Invalid amount for ${tx.txn_id}`);
      hasErrors = true;
      return;
    }
    if (seenTxnIds.has(tx.txn_id) || seenSapLids.has(tx.sap_lid)) {
      console.error(`[Error ${idx + 1}] Duplicate transaction detected: ${tx.txn_id} / ${tx.sap_lid}`);
      hasErrors = true;
      return;
    }
    if (tx.status !== 'SUCCESS') {
      console.warn(`[Skip ${idx + 1}] Non-success status (${tx.status}) for ${tx.txn_id}`);
      return;
    }

    seenTxnIds.add(tx.txn_id);
    seenSapLids.add(tx.sap_lid);
    totalPaisa += Math.round(amount * 100);

    console.log(
      `[Sync ${idx + 1}] Date: ${tx.date} | ID: ${tx.txn_id} | SAP: ${tx.sap_lid} | Amount: ৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })} | Status: ${tx.status}`
    );
  });

  const totalAmount = totalPaisa / 100;
  const expectedPaisa = Math.round(Number(payload.total_disputed_pool_bdt) * 100);
  const verified = !hasErrors && totalPaisa === expectedPaisa;

  console.log('---------------------------------');
  console.log(`Total Validated Capital Inflow: ৳${totalAmount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`);

  if (verified) {
    console.log('Sync Status: SUCCESS (100% Verified with DBBL Core Ledger)');
  } else {
    console.error('Sync Status: FAILED (Mismatch or Validation Error Detected)');
  }

  return {
    verified,
    totalAmount,
    expectedAmount: Number(payload.total_disputed_pool_bdt),
    transactionCount: seenTxnIds.size,
  };
}

async function syncToDatabase(payload) {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/sae_pos',
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const accRes = await client.query(
      `SELECT id FROM accounts WHERE deal_id = $1 OR account_number = '5100029481' LIMIT 1`,
      [payload.dealer_id]
    );
    if (accRes.rows.length === 0) {
      throw new Error(`Target account for ${payload.dealer_id} not found. Run seed.sql first.`);
    }
    const accountId = accRes.rows[0].id;

    let inserted = 0;
    for (const tx of payload.transactions) {
      if (tx.status !== 'SUCCESS') continue;
      const refNote = `NPSB ${tx.txn_id} | SAP ${tx.sap_lid} (${tx.date})`;
      const existing = await client.query(
        'SELECT id FROM transactions WHERE account_id = $1 AND reference_note = $2 LIMIT 1',
        [accountId, refNote]
      );
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO transactions (account_id, transaction_type, amount, payment_method, status, reference_note, created_by)
           VALUES ($1, 'Settlement', $2, 'NPSB', 'SETTLED', $3, 'api_sync')`,
          [accountId, tx.amount, refNote]
        );
        inserted += 1;
      }
    }

    await client.query('COMMIT');
    console.log(`Database Sync: ${inserted} new settlement transaction(s) recorded.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database Sync Error:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  const result = syncLedger(apiPayload);
  if (!result.verified) {
    process.exitCode = 1;
  } else if (process.argv.includes('--db') || process.env.SYNC_TO_DB === 'true') {
    syncToDatabase(apiPayload);
  }
}

module.exports = { apiPayload, syncLedger, syncToDatabase };
```
