
import React, { useState, useEffect } from 'react';

function App() {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/accounts')
      .then(res => res.json())
      .then(data => setAccounts(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', background: '#0d1117', color: '#fff', minHeight: '100vh' }}>
      <h1>Salsabilah POS (SR Electronics Park)</h1>
      <h2>Secure Workspace - Account Balances</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '20px' }}>
        {accounts.map(acc => (
          <div key={acc.id} style={{ background: '#161b22', padding: '20px', borderRadius: '8px', border: '1px solid #30363d' }}>
            <h3>{acc.account_name} ({acc.account_type})</h3>
            <p>Account No: {acc.account_number}</p>
            <h2>৳ {Number(acc.balance).toLocaleString()}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
