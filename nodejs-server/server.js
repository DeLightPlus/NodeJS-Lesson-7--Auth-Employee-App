require('dotenv').config();
const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin'); // Import Firebase Admin SDK

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
const serviceAccount = require('./firebase/service-key.json'); // Path to your Firebase service account file
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// Firestore database reference
const db = admin.firestore();

// Add custom claims to a user (for example, add sysadmin role)
async function addSysAdminClaims(email) {
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { role: 'sysadmin' });
        console.log(`Custom claims added to ${email} successfully.`);
    } catch (error) {
        console.error("Error adding custom claims:", error);
    }
}

// Uncomment to run the function and add a super admin manually
// addSysAdminClaims('matlakalakabelo1@gmail.com');  // Add your super-admin email here

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

// POST: Login endpoint
app.post('/login', async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    if (!idToken) {
        return res.status(400).send("Authorization token is required.");
    }

    try {
        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const trimmedEmail = decodedToken.email.trim(); // Get email from decoded token

        // Fetch the user record from Firebase Admin SDK using the UID
        const userRecord = await admin.auth().getUser(uid);

        // Check if the user has the sysadmin role in custom claims
        if (userRecord.customClaims && userRecord.customClaims.role === 'sysadmin') {
            console.log(`User ${trimmedEmail} is a sysadmin`);

            // Create a Firebase custom token for the user
            const customToken = await admin.auth().createCustomToken(uid);
            return res.json({ token: customToken }); // Send custom token to client
        } else {
            console.log(`User ${trimmedEmail} is not authorized`);
            return res.status(403).send("Not authorized");
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).send("Login failed");
    }
});

// GET: Admin users (only sysadmin can view)
app.get('/admin-users', checkAuth, async (req, res) => {
    try {
        if (req.user.role !== 'sysadmin') {
            return res.status(403).send('Forbidden');
        }

        // Fetch the list of admin users from the database
        const adminUsersSnapshot = await db.collection('users').where('role', '==', 'admin').get();
        const adminUsers = adminUsersSnapshot.docs.map(doc => doc.data());
        res.json(adminUsers);
    } catch (error) {
        console.error("Error fetching admin users:", error);
        res.status(500).send("Failed to fetch admin users");
    }
});

// POST: Add Admin (only sysadmin can add new admins)
app.post('/add-admin', checkAuth, async (req, res) => {
    if (req.user.role !== 'sysadmin') {
        return res.status(403).send("Not authorized");
    }

    const { email } = req.body;
    if (!email) {
        return res.status(400).send("Email is required");
      }

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        console.log(userRecord.uid);
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });

        // Optionally, add user to Firestore as well
        await db.collection('users').doc(userRecord.uid).set({
            email: email,
            role: 'admin',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.status(200).send("Admin added");
    } catch (error) {
        console.log('Error in /add-admin handler:', error);
        return res.status(500).send("Error adding admin");
    }
});

// POST: Create Employee (admins/sysadmins can create employees)
app.post('/create-employee', checkAuth, async (req, res) => {
    if (req.user.role !== 'sysadmin' && req.user.role !== 'admin') {
        return res.status(403).send("Not authorized");
    }

    const { name, age, role } = req.body;

    try {
        const employeeRef = db.collection('employees').doc();
        await employeeRef.set({ name, age, role });
        return res.status(200).send("Employee created");
    } catch (error) {
        return res.status(500).send("Error creating employee");
    }
});

// POST: Remove Admin Rights (only sysadmin can remove admin rights)
app.post('/remove-admin', checkAuth, async (req, res) => {
    if (req.user.role !== 'sysadmin') {
        return res.status(403).send("Not authorized");
    }

    const { email } = req.body;

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'user' });

        // Optionally, update Firestore to reflect the role change
        await db.collection('users').doc(userRecord.uid).update({ role: 'user' });

        return res.status(200).send("Admin rights removed");
    } catch (error) {
        return res.status(500).send("Error removing admin rights");
    }
});

// DELETE: Delete Employee (only sysadmin can delete)
app.delete('/delete-employee/:id', checkAuth, async (req, res) => {
    if (req.user.role !== 'sysadmin') {
        return res.status(403).send('Not authorized');
    }

    const { id } = req.params;

    try {
        const employeeRef = db.collection('employees').doc(id);
        await employeeRef.delete();
        return res.status(200).send('Employee deleted');
    } catch (error) {
        return res.status(500).send('Error deleting employee');
    }
});

// GET: Employee Profile (admins/sysadmins can view employee profiles)
app.get('/employee/:id', checkAuth, async (req, res) => {
    const { id } = req.params;

    try {
        const employeeDoc = await db.collection('employees').doc(id).get();
        if (!employeeDoc.exists) {
            return res.status(404).send('Employee not found');
        }

        return res.json(employeeDoc.data());
    } catch (error) {
        return res.status(500).send('Error fetching employee details');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
