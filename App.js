```javascript
import React, { useState, useEffect, useCallback } from 'react';

const API_BASE =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ||
  'http://localhost:5000';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at top center, rgba(6, 182, 212, 0.12), transparent 45%), #030712',
    color: '#f8fafc',
    fontFamily: "'Inter', 'Hind Siliguri', sans-serif",
    padding: '20px',
  },
  container: { maxWidth: '980px', margin: '0 auto' },
  header: {
    background: 'linear-gradient(135deg, #0b132b 0%, #0e3a5f 55%, #0e7490 100%)',
    borderRadius: '18px',
    padding: '24px',
    textAlign: 'center',
    border: '1px solid rgba(6, 182, 212, 0.35)',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
    marginBottom: '22px',
  },
  monogram: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    margin: '0 auto 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '22px',
    color: '#1e1b0e',
    background: 'linear-gradient(145deg, #fef08a 0%, #f59e0b 48%, #b45309 100%)',
    boxShadow: '0 0 22px rgba(245, 158, 11, 0.45), 0 0 32px rgba(6, 182, 212, 0.25)',
    border: '1px solid rgba(253, 230, 138, 0.8)',
  },
  title: { margin: '4px 0', fontSize: '24px', fontWeight: 700, color: '#ffffff' },
  subtitle: { margin: '4px 0', fontSize: '13px', color: '#fde68a' },
  pill: {
    display: 'inline-block',
    marginTop: '10px',
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#67e8f9',
    background: 'rgba(15, 23, 42, 0.75)',
    border: '1px solid rgba(6, 182, 212, 0.45)',
  },
  tabs: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' },
  tabBtn: (active) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: active ? '1px solid #06b6d4' : '1px solid #1e293b',
    background: active ? 'rgba(6, 182, 212, 0.18)' : '#0f172a',
    color: active ? '#67e8f9' : '#94a3b8',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  }),
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '14px',
  },
  card: {
    background: '#0f172a',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #1e293b',
    borderLeft: '4px solid #06b6d4',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1e293b',
    paddingBottom: '8px',
    marginBottom: '10px',
    fontWeight: 700,
    fontSize: '15px',
  },
  badge: {
    fontSize: '10px',
    padding: '3px 8px',
    borderRadius: '6px',
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  row: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' },
  muted: { color: '#94a3b8' },
  form: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '18px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '10px',
    alignItems: 'end',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: '#030712',
    color: '#f8fafc',
    fontSize: '13px',
    boxSizing: 'border-box',
  },
  submitBtn: {
    padding: '9px 14px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #0891b2, #0e7490)',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  footer: {
    textAlign: 'center',
    marginTop: '28px',
    paddingTop: '14px',
    borderTop: '1px solid #1e293b',
    fontSize: '12px',
    color: '#94a3b8',
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState('accounts');
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [statusMsg, setStatusMsg] = useState('Connecting to S.R. Electronics Park API...');
  const [loading, setLoading] = useState(true);

  const [txForm, setTxForm] = useState({
    account_id: '',
    transaction_type: 'Deposit',
    amount: '',
    reference_note: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, txRes, invRes, custRes] = await Promise.all([
        fetch(`${API_BASE}/api/accounts`),
        fetch(`${API_BASE}/api/transactions?limit=20`),
        fetch(`${API_BASE}/api/inventory`),
        fetch(`${API_BASE}/api/customers`),
      ]);
      if (!accRes.ok) throw new Error('API request failed');

      const [accData, txData, invData, custData] = await Promise.all([
        accRes.json(),
        txRes.ok ? txRes.json() : [],
        invRes.ok ? invRes.json() : [],
        custRes.ok ? custRes.json() : [],
      ]);

      setAccounts(accData);
      setTransactions(txData);
      setInventory(invData);
      setCustomers(custData);
      if (accData.length > 0 && !txForm.account_id) {
        setTxForm((prev) => ({ ...prev, account_id: String(accData[0].id) }));
      }
      setStatusMsg(`Live API Connected (${accData.length} accounts)`);
    } catch (err) {
      setStatusMsg(`API Offline: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [txForm.account_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleTransactionSubmit(e) {
    e.preventDefault();
    setStatusMsg('Processing transaction...');
    try {
      const res = await fetch(`${API_BASE}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: Number(txForm.account_id),
          transaction_type: txForm.transaction_type,
          amount: Number(txForm.amount),
          reference_note: txForm.reference_note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transaction failed');
      setTxForm((prev) => ({ ...prev, amount: '', reference_note: '' }));
      setStatusMsg(data.message || 'Transaction completed.');
      loadData();
    } catch (err) {
      setStatusMsg(`Error: ${err.message}`);
    }
  }

  const formatBDT = (val) =>
    `৳ ${Number(val || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.monogram}>SR</div>
          <h1 style={styles.title}>S.R. Electronics Park — Central ERP</h1>
          <p style={styles.subtitle}>
            An Enterprise of Salsabilah Amin Limited · Salsabilah Sovereign Singularity
          </p>
          <span style={styles.pill}>✦ Powered by Gemini · {statusMsg}</span>
        </header>

        <div style={styles.tabs}>
          {['accounts', 'transactions', 'inventory', 'customers'].map((tab) => (
            <button
              key={tab}
              type="button"
              style={styles.tabBtn(activeTab === tab)}
              onClick={() => setActiveTab(tab)}
            >
              {tab.toUpperCase()}
            </button>
          ))}
          <button type="button" style={styles.tabBtn(false)} onClick={loadData}>
            ↻ REFRESH
          </button>
        </div>

        {activeTab === 'accounts' && (
          <>
            <form style={styles.form} onSubmit={handleTransactionSubmit}>
              <div>
                <label style={styles.muted}>Account</label>
                <select
                  style={styles.input}
                  value={txForm.account_id}
                  onChange={(e) => setTxForm({ ...txForm, account_id: e.target.value })}
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.muted}>Type</label>
                <select
                  style={styles.input}
                  value={txForm.transaction_type}
                  onChange={(e) => setTxForm({ ...txForm, transaction_type: e.target.value })}
                >
                  <option value="Deposit">Deposit</option>
                  <option value="Withdraw">Withdraw</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Settlement">Settlement</option>
                </select>
              </div>
              <div>
                <label style={styles.muted}>Amount (BDT)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  style={styles.input}
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label style={styles.muted}>Reference Note</label>
                <input
                  type="text"
                  style={styles.input}
                  value={txForm.reference_note}
                  onChange={(e) => setTxForm({ ...txForm, reference_note: e.target.value })}
                  placeholder="NPSB / SAP ref"
                />
              </div>
              <button type="submit" style={styles.submitBtn}>
                Post Transaction
              </button>
            </form>

            {loading ? (
              <p style={styles.muted}>Loading accounts...</p>
            ) : (
              <div style={styles.grid}>
                {accounts.map((acc) => (
                  <div key={acc.id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <span>{acc.account_name}</span>
                      <span style={styles.badge}>{acc.account_type}</span>
                    </div>
                    <div style={styles.row}>
                      <span style={styles.muted}>Account No:</span>
                      <span>{acc.account_number}</span>
                    </div>
                    <div style={styles.row}>
                      <span style={styles.muted}>Balance:</span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>{formatBDT(acc.balance)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'transactions' && (
          <div style={styles.grid}>
            {transactions.map((tx) => (
              <div key={tx.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span>{tx.account_name}</span>
                  <span style={styles.badge}>{tx.transaction_type}</span>
                </div>
                <div style={styles.row}>
                  <span style={styles.muted}>Amount:</span>
                  <span>{formatBDT(tx.amount)}</span>
                </div>
                <div style={styles.row}>
                  <span style={styles.muted}>Note:</span>
                  <span>{tx.reference_note || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div style={styles.grid}>
            {inventory.map((item) => (
              <div key={item.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span>{item.item_name}</span>
                  <span style={styles.badge}>Qty: {item.stock_quantity}</span>
                </div>
                <div style={styles.row}>
                  <span style={styles.muted}>Category:</span>
                  <span>{item.category || '-'}</span>
                </div>
                <div style={styles.row}>
                  <span style={styles.muted}>Unit Price:</span>
                  <span>{formatBDT(item.unit_price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'customers' && (
          <div style={styles.grid}>
            {customers.map((cust) => (
              <div key={cust.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span>{cust.customer_name}</span>
                  <span style={styles.badge}>{cust.phone}</span>
                </div>
                <div style={styles.row}>
                  <span style={styles.muted}>Due Amount:</span>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{formatBDT(cust.due_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer style={styles.footer}>
          <strong style={{ color: '#67e8f9' }}>Powered by Gemini</strong> · Salsabilah Enterprise ERP Engine &amp; SAP ECC 6.0 Integration Hub
        </footer>
      </div>
    </div>
  );
}
```
