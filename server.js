
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/sae_pos'
});

app.get('/api/accounts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM accounts');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/transactions', async (req, res) => {
    const { account_id, transaction_type, amount, reference_note } = req.body;
    try {
        await pool.query('BEGIN');
        await pool.query(
            'INSERT INTO transactions (account_id, transaction_type, amount, reference_note) VALUES ($1, $2, $3, $4)',
            [account_id, transaction_type, amount, reference_note]
        );
        
        let queryStr = transaction_type === 'Deposit' ? 
            'UPDATE accounts SET balance = balance + $1 WHERE id = $2' : 
            'UPDATE accounts SET balance = balance - $1 WHERE id = $2';
            
        await pool.query(queryStr, [amount, account_id]);
        await pool.query('COMMIT');
        res.json({ success: true, message: 'Transaction completed securely.' });
    } catch (err) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SAE POS Server running on port ${PORT}`));
