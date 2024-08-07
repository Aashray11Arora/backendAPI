const express = require('express');
const sql = require('mssql');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const csvParser = require('csv-parser');
const fastcsv = require('fast-csv');
const { Readable } = require('stream');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware setup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Change '*' to your specific origin(s) for better security
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true'); // Add this line
  next();
});

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*'); // Change '*' to your specific origin(s) for better security
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true'); // Add this line
  res.sendStatus(200);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Adjust path as needed

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Database configuration
const config = {
    user: 'PritpalAdmin',
    password: 'Pritpal@123',
    server: 'dbverifyamritmalwa.database.windows.net',
    database: 'NOC_Details',
    options: {
        encrypt: true,
        trustServerCertificate: false,
        connectionTimeout: 50000,
        requestTimeout: 50000
    }
};

// Connect to the database
sql.connect(config, (err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to the database');
    }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
