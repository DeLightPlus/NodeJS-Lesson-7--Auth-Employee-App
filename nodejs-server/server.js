require('dotenv').config();
const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin'); // Firebase Admin SDK

const app = express();
const port = 8000;

// Middleware to parse JSON and handle body
app.use(express.json());
app.use(bodyParser.json());

// CORS setup (Allowing requests from specific frontend URLs)
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, origin);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

// Initialize Firebase Admin SDK with the service account credentials
const serviceAccount = require('./firebase/service-key.json'); // Path to Firebase service account file
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// Firestore database reference
const db = admin.firestore();

// Middleware to check if the user is authenticated and has the correct role
const checkAuth = async (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) {
        return res.status(401).send('Unauthorized');
    }

    try {
        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;

        // Log the decoded token for debugging purposes
        console.log('Decoded Token:', decodedToken);

        // Ensure the role is included in the decoded token (custom claim check)
        if (req.user.role && ['admin', 'sysadmin'].includes(req.user.role)) {
            next();
        } else {
            return res.status(403).send('Forbidden: Invalid role');
        }
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).send('Unauthorized');
    }
};

// POST: Add Admin (only sysadmin can add new admins)
app.post('/add-admin', checkAuth, async (req, res) => {
    if (req.user.role !== 'sysadmin') {
        return res.status(403).send("Not authorized");
    }

    const { email, firstName, lastName, photoURL } = req.body;

    if (!email || !firstName || !lastName) {
        return res.status(400).send("Email, first name, and last name are required");
    }

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        console.log(userRecord.uid);
        
        // Set custom claim for 'admin' role
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });

        // Optionally, add user to Firestore as well
        await db.collection('users').doc(userRecord.uid).set({
            email,
            firstName,
            lastName,
            photoURL: photoURL || '',
            role: 'admin',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.status(200).send("Admin added successfully");
    } catch (error) {
        console.error('Error in /add-admin handler:', error);
        return res.status(500).send("Error adding admin");
    }
});

// POST: Remove Admin (only sysadmin can remove admin rights)
app.post('/remove-admin', checkAuth, async (req, res) => {
    if (req.user.role !== 'sysadmin') {
        return res.status(403).send("Not authorized");
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).send("Email is required");
    }

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'user' });

        // Optionally, update Firestore to reflect the role change
        await db.collection('users').doc(userRecord.uid).update({ role: 'user' });

        return res.status(200).send("Admin rights removed successfully");
    } catch (error) {
        console.error("Error removing admin:", error);
        return res.status(500).send("Error removing admin rights");
    }
});

// GET: Admin users (only sysadmin can view)
app.get('/admin-users', checkAuth, async (req, res) => {
    try {
        if (req.user.role !== 'sysadmin') {
            return res.status(403).send('Forbidden');
        }

        // Fetch the list of admin users from Firestore
        const adminUsersSnapshot = await db.collection('users').where('role', '==', 'admin').get();
        const adminUsers = adminUsersSnapshot.docs.map(doc => doc.data());

        res.json(adminUsers);
    } catch (error) {
        console.error("Error fetching admin users:", error);
        res.status(500).send("Failed to fetch admin users");
    }
});

// POST: Update Admin (only sysadmin can update admin info)
app.post('/update-admin', checkAuth, async (req, res) => {
    if (req.user.role !== 'sysadmin') {
        return res.status(403).send("Not authorized");
    }

    const { uid, firstName, lastName, photoURL } = req.body;

    if (!uid || !firstName || !lastName) {
        return res.status(400).send("UID, first name, and last name are required");
    }

    try {
        // Update user info in Firestore
        await db.collection('users').doc(uid).update({
            firstName,
            lastName,
            photoURL: photoURL || ''
        });

        return res.status(200).send("Admin updated successfully");
    } catch (error) {
        console.error("Error updating admin:", error);
        return res.status(500).send("Error updating admin");
    }
});

// POST: Login endpoint (for non-admin users too)
app.post('/login', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    if (!idToken) {
        return res.status(400).send("Authorization token is required.");
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Fetch user data from Firebase
        const userRecord = await admin.auth().getUser(uid);

        if (userRecord.customClaims && userRecord.customClaims.role === 'sysadmin') {
            const customToken = await admin.auth().createCustomToken(uid);
            return res.json({ token: customToken });
        } else {
            return res.status(403).send("Not authorized");
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).send("Login failed");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
