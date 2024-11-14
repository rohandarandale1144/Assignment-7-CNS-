// server.js
const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'super_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 } // Session lasts 1 minute for testing
}));

// Mock database for demonstration purposes
const users = [];

// Serve the main page
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Registration form (GET request)
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));

app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'views', 'contact.html')));

// Registration logic (POST request)
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Check if user already exists
    const userExists = users.some(user => user.username === username);
    if (userExists) {
        return res.json({ success: false, message: 'User already exists. Please try a different username.' });
    }

    // Save the user in the mock database
    users.push({ username, password });
    console.log('Registered users:', users);

    res.json({ success: true, message: 'Registration successful.' });
});

// Login form (GET request)
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));

// Login logic (POST request) with lockout mechanism
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Initialize session variables if not already set
    if (!req.session.failedAttempts) req.session.failedAttempts = 0;
    if (!req.session.locked) req.session.locked = false;

    // Check if user is locked out
    if (req.session.locked) {
        return res.json({
            success: false,
            message: 'Account is locked due to multiple failed attempts. Please try again later.'
        });
    }

    // Validate user credentials
    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
        req.session.username = username;
        req.session.failedAttempts = 0; // Reset the counter on successful login
        res.json({ success: true, message: 'Login successful.' });
    } else {
        req.session.failedAttempts += 1;
        if (req.session.failedAttempts >= 3) {
            req.session.locked = true;
            res.json({
                success: false,
                message: 'Too many failed attempts. You are locked out.'
            });
        } else {
            res.json({
                success: false,
                message: `Invalid credentials. Attempt ${req.session.failedAttempts} of 3.`
            });
        }
    }
});

// Dashboard route - protected
app.get('/dashboard', (req, res) => {
    if (req.session.username) {
        res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
    } else {
        res.redirect('/login');
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// About page
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'views', 'about.html')));

app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    console.log('New Message from Contact Form:');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Message: ${message}`);

    res.send(`
        <html>
            <body>
                <h1>Thank you for your message, ${name}!</h1>
                <p>We have received your message and will get back to you soon.</p>
                <a href="/">Go back to the Home Page</a>
            </body>
        </html>
    `);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));