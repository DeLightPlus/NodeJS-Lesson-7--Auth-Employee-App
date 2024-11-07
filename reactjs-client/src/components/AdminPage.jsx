import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase/config';
 // Assuming you have firebase.js set up with Firebase auth

const AdminPage = () => {
  const [admins, setAdmins] = useState([]);  // State to hold the list of admin users
  const [error, setError] = useState('');    // State for error messages
  const [email, setEmail] = useState('');    // State to hold new admin's email
  const [loading, setLoading] = useState(false); // Loading state for async actions
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to fetch admin users
  const fetchAdmins = async () => {
    setLoading(true);
    setError(''); // Reset the error message

    try {
      const user = auth.currentUser;  // Get the currently signed-in user
      if (user) {
        const idToken = await user.getIdToken();  // Get the Firebase ID Token

        // Make API call to fetch the list of admin users
        const response = await axios.get('http://localhost:8000/admin-users', {
          headers: {
            Authorization: `Bearer ${idToken}`,  // Send token in the Authorization header
          }
        });

        setAdmins(response.data);  // Set the fetched admins to state
      } else {
        setError('User is not authenticated');
      }
    } catch (err) {
      setError('Error fetching admins: ' + err.message);
    } finally {
      setLoading(false);  // Stop loading spinner after the request completes
    }
  };

  // Function to add a new admin
  const handleAddAdmin = async (e) => {
    e.preventDefault(); // Prevent default form submission

    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError('');  // Reset the error message

    try {
      const user = auth.currentUser;  // Get the currently signed-in user
      if (user) {
        const idToken = await user.getIdToken();  // Get the Firebase ID Token
        
        // Make API call to add a new admin
        const response = await axios.post('http://localhost:8000/add-admin', {
          email: email,  // Pass the email of the new admin
        }, {
          headers: {
            Authorization: `Bearer ${idToken}`,  // Add token to the Authorization header
          }
        });

        console.log('Admin added:', response.data);
        setEmail('');  // Clear the email input field
        fetchAdmins();  // Refresh the list of admins
      }
    } catch (err) {
      setError('Error adding admin: ' + err.message);
    } finally {
      setLoading(false);  // Stop loading spinner after the request completes
    }
  };

  // UseEffect to fetch admin users when the component mounts
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) 
        {
          setIsAuthenticated(true);
          fetchAdmins(); // Fetch admins after the user is authenticated
        } 
        else 
        {
          setIsAuthenticated(false);
          setAdmins([]);
        }
      });
  
      // Clean up the listener on component unmount
      return () => unsubscribe();
  }, []);  // Empty dependency array means this effect runs only once when the component mounts

  return (
    <div>
      <h1>Admin Page</h1>

      {/* Display error or success messages */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Button to manually fetch admin users */}
      <button onClick={fetchAdmins} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Admins'}
      </button>

      <h2>Admins List</h2>
      {/* List of admin users */}
      <ul>
        {admins.length === 0 ? (
          <li>No admins found.</li>
        ) : (
          admins.map((admin) => (
            <li key={admin.uid}>{admin.email}</li>
          ))
        )}
      </ul>

      <hr />

      <h2>Add New Admin</h2>
      {/* Form to add new admin */}
      <form onSubmit={handleAddAdmin}>
        <div>
          <label htmlFor="email">Admin Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Update the email state
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Adding Admin...' : 'Add Admin'}
        </button>
      </form>
    </div>
  );
};

export default AdminPage;
