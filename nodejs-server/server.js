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

/* *********************************************************** */

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
            let userRecord;
            try {
                // Try to get the user by email from Firebase Authentication
                userRecord = await admin.auth().getUserByEmail(email);
            } catch (error) {
                if (error.code === 'auth/user-not-found') {
                    // If the user does not exist, create the user
                    userRecord = await admin.auth().createUser({
                        email,
                        emailVerified: false,
                        password: 'default-password', // Set a default password or generate one
                        displayName: `${firstName} ${lastName}`,
                        photoURL: photoURL || '',
                    });
                } else {
                    throw error; // Re-throw any other errors
                }
            }

            // Now that we have the user (either newly created or already existing), set the custom claim for admin
            await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });

            // Optionally, add user details to Firestore, including the uid
            await db.collection('users').doc(userRecord.uid).set({
                email,
                firstName,
                lastName,
                photoURL: photoURL || '',
                role: 'admin',
                uid: userRecord.uid,  // Store the Firebase UID
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
            // Fetch the user record from Firebase Authentication
            const userRecord = await admin.auth().getUserByEmail(email);

            // Remove the admin custom claim from Firebase Authentication
            await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'user' });

            // Optionally, update the role in Firestore to 'user'
            await db.collection('users').doc(userRecord.uid).update({ role: 'user' });

            return res.status(200).send("Admin rights removed successfully");
        } catch (error) {
            console.error("Error removing admin:", error);
            
            // Provide more detailed error messages
            if (error.code === 'auth/user-not-found') {
                return res.status(404).send("User not found");
            }

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

/* ************************************************************* */

app.post('/login', async (req, res) => 
    {
        const idToken = req.headers.authorization?.split('Bearer ')[1]; // Get token from request

        if (!idToken) 
        {
            return res.status(400).send("Authorization token is required.");
        }

        try {
            // Decode the Firebase ID token to verify the user
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;

            // Fetch user data from Firebase Authentication
            const userRecord = await admin.auth().getUser(uid);

            // Check if the user has the 'admin' role in their custom claims
            if (userRecord.customClaims && userRecord.customClaims.role === 'sysadmin') 
            {
                // If the user is a super-admin, issue a custom token with admin privileges
                const customToken = await admin.auth().createCustomToken(uid, { role: 'sysadmin' });
                return res.json({ token: customToken, role: 'sysadmin' });
            } 
            else if (userRecord.customClaims && userRecord.customClaims.role === 'admin') 
            {
                // If the user is a general-admin, issue a custom token with admin privileges
                const customToken = await admin.auth().createCustomToken(uid, { role: 'admin' });
                return res.json({ token: customToken, role: 'admin' });
            } 
            else 
            {
                return res.status(403).send("Not authorized: User is not an admin");
            }
        } 
        catch (error) 
        {
            console.error("Login error:", error);
            return res.status(500).send("Login failed");
        }
    });

/* ******************************************************************* */
// Add employee route (POST request to add employee)
app.post('/api/employees', checkAuth, async (req, res) => {
        // Only allow admins or sysadmins to add employees
        if (req.user.role !== 'admin' && req.user.role !== 'sysadmin') {
            return res.status(403).send("Not authorized");
        }

        const { firstName, lastName, email, role } = req.body;

        if (!firstName || !lastName || !email || !role) {
            return res.status(400).send("All fields (firstName, lastName, email, role) are required.");
        }

        try {
            // Add employee to Firestore or a database of your choice
            const employeeRef = await db.collection('employees').add({
                firstName,
                lastName,
                email,
                role,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                addedBy: req.user.id
            });

            return res.status(201).json({
                id: employeeRef.id,
                firstName,
                lastName,
                email,
                role,
                addedBy: req.user.id,  // Include the user who added the employee in the response
            });

        } 
        catch (error) 
        {
            console.error('Error adding employee:', error);
            return res.status(500).send("Error adding employee.");
        }
    });

// API endpoint to get all employees
app.get('/api/employees', checkAuth, async (req, res) => {
    try {
        // Fetch all employees from the Firestore collection
        const snapshot = await db.collection('employees').get();

        // If no employees are found, return a 404 error
        if (snapshot.empty) {
            return res.status(404).send("No employees found.");
        }

        // Map the documents to a plain object array
        const employees = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Return the list of employees in the response
        return res.status(200).json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        return res.status(500).send("Error fetching employees.");
    }
});


// // API endpoint to get all employees, optionally filtered by admin (addedBy)
// app.get('/api/employees', checkAuth, async (req, res) => {
//     try 
//     {
//         const { addedBy } = req.query;  // Get the optional 'addedBy' filter from the query params

//         // Start the Firestore query
//         let query = db.collection('employees');

//         // If 'addedBy' is specified, filter by the admin who added the employee
//         if (addedBy) {
//             query = query.where('addedBy', '==', addedBy);
//         }

//         // Fetch the employees
//         const snapshot = await query.get();

//         if (snapshot.empty) {
//             return res.status(404).send("No employees found.");
//         }

//         // Map the documents to a plain object
//         const employees = snapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data(),
//         }));

//         return res.status(200).json(employees);

//     } catch (error) {
//         console.error('Error fetching employees:', error);
//         return res.status(500).send("Error fetching employees.");
//     }
// });

// API endpoint to get a specific employee by ID (with addedBy field)
app.get('/api/employees/:id', checkAuth, async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch the employee by ID
        const employeeDoc = await db.collection('employees').doc(id).get();

        if (!employeeDoc.exists) {
            return res.status(404).send("Employee not found.");
        }

        // Get the employee data and include the addedBy field
        const employee = employeeDoc.data();
        return res.status(200).json({
            id: employeeDoc.id,
            ...employee,
        });

    } catch (error) {
        console.error('Error fetching employee by ID:', error);
        return res.status(500).send("Error fetching employee.");
    }
});






// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
