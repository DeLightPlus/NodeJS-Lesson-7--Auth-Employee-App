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
const serviceAccount = require('./firebase/hotel-app-service-key.json'); // Path to your Firebase service account file
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

    if (!token) { return res.status(401).send('Unauthorized'); }

    try 
    {
        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;

        // Log the decoded token for debugging purposes
        console.log('Decoded Token:', decodedToken);

        // Ensure the role is included in the decoded token (custom claim check)
        if (req.user.role && ['admin', 'sysadmin'].includes(req.user.role)) 
        {
            next();
        } 
        else 
        {
            return res.status(403).send('Forbidden: Invalid role');
        }
    } 
    catch (error) 
    {
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

// GET: Get Super Admin's email (only accessible by sysadmin)
app.get('/super-admin', checkAuth, async (req, res) => {
    try {
        // Only sysadmins can access this route
        if (req.user.role !== 'sysadmin') {
            return res.status(403).send('Forbidden');
        }

        // You could also fetch a specific super admin's details if needed
        // For example, if you store the super admin info in Firestore, you could query it here

        // In this case, we assume the super admin's email is stored in the Firebase Authentication user's claims.
        const userRecord = await admin.auth().getUserByEmail('matlakalakabelo1@gmail.com');  // Replace with actual email if needed
        res.json({ email: userRecord.email });
    } catch (error) {
        console.error('Error fetching super admin:', error);
        res.status(500).send('Error fetching super admin');
    }
});

// GET: Admin users (only sysadmin can view)
app.get('/admin-users', checkAuth, async (req, res) => {
    try 
    {
        if (req.user.role !== 'sysadmin') {
            return res.status(403).send('Forbidden');
        }

        // Fetch the list of admin users from the database
        const adminUsersSnapshot = await db.collection('users').where('role', '==', 'admin').get();
        const adminUsers = adminUsersSnapshot.docs.map(doc => doc.data());
        res.json(adminUsers);
    } 
    catch (error) 
    {
        console.error("Error fetching admin users:", error);
        res.status(500).send("Failed to fetch admin users");
    }
});

// POST: Add Admin (only sysadmin can add new admins)
app.post('/add-admin', checkAuth, async (req, res) => {
    if (req.user.role !== 'sysadmin') {
        return res.status(403).send('Not authorized');
    }

    const { email, firstName, lastName, photoURL } = req.body;

    if (!email || !firstName || !lastName) {
        return res.status(400).send("Email, first name, and last name are required");
    }

    try {
        // Check if the email already exists in Firebase Authentication
        const existingUser = await admin.auth().getUserByEmail(email).catch(() => null);

        if (existingUser) {
            // If the user already exists, just update their role to admin in Firestore (if necessary)
            const userDocRef = db.collection('users').doc(existingUser.uid);
            await userDocRef.update({
                role: 'admin',
                firstName,
                lastName,
                photoURL: photoURL || '',
            });

            // Update custom claims for the user (mark them as admin)
            await admin.auth().setCustomUserClaims(existingUser.uid, { role: 'admin' });

            return res.status(200).send('Admin added successfully');
        } else {
            // If the user doesn't exist, create a new user in Firebase Authentication
            const userRecord = await admin.auth().createUser({
                email,
                emailVerified: false,
                password: 'default-password', // You can generate a default password here
            });

            // Store the user's details in Firestore
            const userDocRef = db.collection('users').doc(userRecord.uid);
            await userDocRef.set({
                email,
                firstName,
                lastName,
                photoURL: photoURL || '',
                role: 'admin', // Default role
                uid: userRecord.uid, // Store the uid in Firestore
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Set custom claims (optional)
            await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });

            return res.status(200).send('Admin added successfully');
        }
    } catch (error) {
        console.error('Error adding admin:', error);
        res.status(500).send('Error adding admin');
    }
});

// POST: Update Admin Details
app.post('/update-admin', checkAuth, async (req, res) => {
    if (req.user.role !== 'sysadmin') {
      return res.status(403).send('Not authorized');
    }
  
    const { uid, firstName, lastName, photoURL } = req.body;
  
    try 
    {
      // Update user profile
      await admin.auth().updateUser(uid, {
        displayName: `${firstName} ${lastName}`,
        photoURL: photoURL || '',  // Optional photo URL
      });
  
      res.status(200).send('Admin updated successfully');
    } 
    catch (error) 
    {
      console.error('Error updating admin:', error);
      res.status(500).send('Error updating admin');
    }
  });

// POST: Remove Admin Privileges
app.post('/remove-admin', checkAuth, async (req, res) => {
    if (req.user.role !== 'sysadmin') {
        return res.status(403).send('Not authorized');
    }

    const { uid } = req.body;  // Ensure 'uid' is passed here.

    if (!uid) {
        return res.status(400).send('User UID is required.');
    }

    try {
        // Set user role to 'user'
        await admin.auth().setCustomUserClaims(uid, { role: 'user' });

        // Optionally, update Firestore to reflect the role change
        await db.collection('users').doc(uid).update({ role: 'user' });

        res.status(200).send('Admin privileges removed');
    } catch (error) {
        console.error('Error removing admin privileges:', error);
        res.status(500).send('Error removing admin privileges');
    }
});

// 
////////////////////////////////////////////////////////////////////////////////
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
