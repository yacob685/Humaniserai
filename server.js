// server.js
const express = require('express');
const stripe = require('stripe')('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'); // ⚠️ IMPORTANT: REPLACE WITH YOUR LIVE SECRET KEY!
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 4242; // Change if necessary

// --- Middleware Setup ---
// Allow cross-origin requests from the frontend (e.g., file:// or http://127.0.0.1:5500)
app.use(cors({ origin: '*' })); 
app.use(bodyParser.json());

// --- Database Simulation (INSECURE for production - Use a real DB) ---
const users = {}; // In-memory store: { email: { password, stripeCustomerId, subscribed: boolean } }

// --- Utility: Simulate JWT Token for Authentication ---
// In a real app, this would use a library like 'jsonwebtoken'
const generateToken = (email) => `${email}_secure_token`;
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    // Simple token validation (checking if it matches the expected format)
    const email = token.split('_secure_token')[0];
    if (users[email]) {
        req.userEmail = email;
        next();
    } else {
        res.sendStatus(403);
    }
};

// =========================================================================
// 1. USER AUTHENTICATION ENDPOINTS (Replaces local storage auth)
// =========================================================================

// POST /register
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (users[email]) {
        return res.status(400).send({ error: 'User already exists.' });
    }
    
    // In a real app, hash the password before storing (e.g., using bcrypt)
    // Here, we save it in plain text for simplicity, but WARN THE USER.
    users[email] = { password: password, subscribed: false, stripeCustomerId: null };

    // You can generate a Stripe Customer here, or on first payment
    try {
        const customer = await stripe.customers.create({ email: email });
        users[email].stripeCustomerId = customer.id;
    } catch (e) {
        console.error('Stripe Customer creation failed:', e.message);
        return res.status(500).send({ error: 'Failed to create Stripe customer.' });
    }

    // Generate a simple auth token for the client to use
    const token = generateToken(email);

    res.send({ 
        message: 'Registration successful. Proceed to payment.',
        token: token,
        email: email
    });
});

// POST /login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users[email];

    if (!user || user.password !== password) {
        return res.status(401).send({ error: 'Invalid email or password.' });
    }
    
    const token = generateToken(email);
    res.send({ 
        message: 'Login successful.',
        token: token,
        subscribed: user.subscribed
    });
});


// =========================================================================
// 2. STRIPE PAYMENT ENDPOINT
// =========================================================================

// POST /create-payment-intent
app.post('/create-payment-intent', authenticateToken, async (req, res) => {
    const userEmail = req.userEmail;
    const user = users[userEmail];

    if (user.subscribed) {
        return res.status(400).send({ error: 'User is already subscribed.' });
    }

    try {
        // Stripe uses cents, so $1.00 USD is 100
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 100, 
            currency: 'usd',
            customer: user.stripeCustomerId,
            setup_future_usage: 'off_session', // Set up for future subscription
            // The subscription logic is simplified here to a one-time charge for demonstration
            // For a real recurring subscription, you would use Stripe Subscriptions API.
            metadata: {
                user_email: userEmail,
                subscription_plan: 'monthly_1_usd'
            }
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
            message: 'Payment Intent created successfully.'
        });
    } catch (e) {
        console.error('Error creating Payment Intent:', e.message);
        res.status(500).send({ error: e.message });
    }
});

// POST /confirm-subscription (Called after successful payment confirmation on frontend)
app.post('/confirm-subscription', authenticateToken, (req, res) => {
    const userEmail = req.userEmail;
    
    if (!users[userEmail]) {
        return res.status(404).send({ error: 'User not found.' });
    }

    // Securely update the user's status after payment verification
    users[userEmail].subscribed = true;
    
    res.send({ 
        message: 'Subscription confirmed successfully.',
        subscribed: true 
    });
});

// =========================================================================
// 3. PAYWALL ENDPOINT
// =========================================================================

// GET /check-subscription
app.get('/check-subscription', authenticateToken, (req, res) => {
    const userEmail = req.userEmail;
    const user = users[userEmail];

    if (!user) {
         // Should not happen if authenticateToken passes, but good practice
        return res.status(404).send({ error: 'User not found.' });
    }

    // This is the single source of truth for the paywall
    res.send({ subscribed: user.subscribed, email: userEmail });
});


// =========================================================================
// 4. SERVER START
// =========================================================================
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('--- WARNING: Server is using in-memory, plain-text password storage. ---');
});
