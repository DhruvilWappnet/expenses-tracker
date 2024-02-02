const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const pg = require('pg');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const port = 3000;

// Postgres Database configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'expense_tracker',
    password: '123',
    port: 5432,
});

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

// Check database connection
pool.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the database');
    }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve HTML, CSS, and JS files
app.use(express.static('public'));

/*---------------------------------------------------------------------------------------------------------------------------*/

// Fetch user name

app.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const result = await pool.query('SELECT user_id, username FROM users WHERE user_id = $1', [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/*---------------------------------------------------------------------------------------------------------------------------*/

// Fetch expenses for a user with their id

app.get('/expenses/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const result = await pool.query(
            'SELECT * FROM expenses WHERE user_id = $1',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

/*---------------------------------------------------------------------------------------------------------------------------*/

// Fetch expences that current user has to pay to other users

app.get('/expenses/to-pay/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const result = await pool.query(
            'SELECT s.split_id, p.username AS payer_name, u.username AS payee_name, e.date AS expense_date, s.amount, s.settled,e.description  ' +
            'FROM splits s ' +
            'INNER JOIN users p ON s.payer_id = p.user_id ' +
            'INNER JOIN users u ON s.payee_id = u.user_id ' +
            'INNER JOIN expenses e ON s.expense_id = e.expense_id ' +
            'WHERE s.payer_id = $1 AND s.settled = false',
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


/*---------------------------------------------------------------------------------------------------------------------------*/

// Fetch expences that current user has to get from other users


app.get('/expenses/to-get/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const result = await pool.query(
            'SELECT s.split_id, p.username AS payer_name, u.username AS payee_name, e.date AS expense_date, s.amount, s.settled,e.description  ' +
            'FROM splits s ' +
            'INNER JOIN users p ON s.payer_id = p.user_id ' +
            'INNER JOIN users u ON s.payee_id = u.user_id ' +
            'INNER JOIN expenses e ON s.expense_id = e.expense_id ' +
            'WHERE s.payee_id = $1 AND s.settled = false',
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


// API endpoint to add expenses
app.post('/addexpenses', async (req, res) => {
    const { userId, amount, description } = req.body;

    // Validate input (add more validation as needed)
    if (!userId || !amount || !description) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
        // Insert data into the expenses table and retrieve the expenses_id
        const result = await pool.query('INSERT INTO expenses (user_id, amount, description, date) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING expense_id', [userId, amount, description]);

        const expensesId = result.rows[0].expense_id;

        res.json({ success: true, message: 'Expense added successfully.', expensesId });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API endpoint to add split
app.post('/addSplitToPayer', async (req, res) => {
    const { payerId, payeeId, amount, expenseId } = req.body;

    // Validate input (add more validation as needed)
    if (!payerId || !payeeId || !amount || !expenseId) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
        // Insert data into the splits table
        await pool.query(
            'INSERT INTO splits (payer_id, payee_id, amount, expense_id, settled) VALUES ($1, $2, $3, $4, false)',
            [payerId, payeeId, amount, expenseId]
        );

        res.json({ success: true, message: 'Split to payer added successfully.' });
    } catch (error) {
        console.error('Error adding split to payer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Express route to handle expense deletion
app.delete('/expenses/:expenseId', async (req, res) => {
    const expenseId = req.params.expenseId;

    try {
        // Delete from the expenses table
        const result = await pool.query('DELETE FROM expenses WHERE expense_id = $1 RETURNING *', [expenseId]);

        // Check if any rows were deleted
        if (result.rowCount > 0) {
            res.json({ success: true, message: 'Expense and associated splits deleted successfully.' });
        } else {
            res.status(404).json({ error: 'Expense not found.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.patch('/settle-expense/:splitId', async (req, res) => {
    const splitId = req.params.splitId;

    try {
        // Perform the database update to mark the expense as settled
        await pool.query('UPDATE splits SET settled = true WHERE split_id = $1', [splitId]);

        res.json({ success: true, message: 'Expense settled successfully.' });
    } catch (error) {
        console.error('Error settling expense:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Middleware to check if the user is authenticated
const authenticateUser = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Login API endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (isPasswordValid) {
                // Set user as authenticated
                req.session.userId = user.user_id;
                res.json({ success: true, message: 'Login successful.' });
            } else {
                res.status(401).json({ error: 'Invalid credentials.' });
            }
        } else {
            res.status(401).json({ error: 'Invalid credentials.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Signup API endpoint
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the username is already taken
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length > 0) {
            res.status(409).json({ error: 'Username is already taken.' });
        } else {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert the new user
            await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);

            res.json({ success: true, message: 'Signup successful.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Logout API endpoint
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logout successful.' });
});

// Expenses API endpoint (protected route)
app.get('/expenses', authenticateUser, (req, res) => {
    // Access to expenses for authenticated users only
    res.json({ message: 'Welcome to the expenses page!' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// 1	"user1"
// 2	"user2"
// 3	"user3"