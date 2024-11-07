import "./styles.css";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase/config';

const AdminPage = ({ setSuperAdminEmail2 }) => 
{
  const [superAdminEmail, setSuperAdminEmail] = useState(''); 

  const [admins, setAdmins] = useState([]);  // State to hold the list of admin users
  
  const [email, setEmail] = useState('');    // State to hold new admin's email
  const [firstName, setFirstName] = useState(''); // State for first name
  const [lastName, setLastName] = useState('');   // State for last name
  const [photoURL, setPhotoURL] = useState('');   // State for photo URL (optional)
  const [loading, setLoading] = useState(false); // Loading state for async actions
  const [error, setError] = useState('');    // State for error messages
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to fetch the super admin's email
  const fetchSuperAdminEmail = async () => {
    setLoading(true);
    setError('');
    
    try {
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken();
        
        const response = await axios.get('http://localhost:8000/super-admin', {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        setSuperAdminEmail(response.data.email);  // Set the super admin's email
        setSuperAdminEmail2(response.data.email)
      }
    } catch (err) {
      setError('Error fetching super admin email: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch admin users
  const fetchAdmins = async () => {
    setLoading(true);
    setError(''); // Reset the error message

    try {
      const user = auth.currentUser;  // Get the currently signed-in user
      if (user) 
      {
        const idToken = await user.getIdToken();  // Get the Firebase ID Token

        // Make API call to fetch the list of admin users
        const response = await axios.get('http://localhost:8000/admin-users', {
          headers: { Authorization: `Bearer ${idToken}`, }
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

    if (!email || !firstName || !lastName) {
        setError('Please enter all required fields (email, first name, and last name)');
        return;
    }

    setLoading(true);
    setError('');  // Reset the error message

    try {
        const user = auth.currentUser;  // Get the currently signed-in user
        if (user) {
            const idToken = await user.getIdToken();  // Get the Firebase ID Token
            
            // Make API call to add or promote admin
            const response = await axios.post('http://localhost:8000/add-admin', {
                email: email,  // Pass the email of the new admin
                firstName: firstName,
                lastName: lastName,
                photoURL: photoURL || '',  // Photo is optional
            }, {
                headers: {
                    Authorization: `Bearer ${idToken}`,  // Add token to the Authorization header
                }
            });

            console.log('Admin added or promoted:', response.data);
            setEmail('');  // Clear the email input field
            setFirstName(''); // Clear the first name
            setLastName(''); // Clear the last name
            setPhotoURL('');  // Clear the photo URL
            fetchAdmins();  // Refresh the list of admins
        }
    } catch (err) {
        setError('Error adding/promoting admin: ' + err.message);
    } finally {
        setLoading(false);  // Stop loading spinner after the request completes
    }
  };

  // Function to remove admin privileges
  const handleRemoveAdmin = async (uid) => {
    setLoading(true);
    setError(''); // Reset the error message

    try {
      const user = auth.currentUser;  // Get the currently signed-in user
      if (user) {
        const idToken = await user.getIdToken();  // Get the Firebase ID Token

        // API call to remove admin privileges (set role to 'user')
        await axios.post('http://localhost:8000/remove-admin', { uid }, {
          headers: {
            Authorization: `Bearer ${idToken}`,  // Add token to the Authorization header
          }
        });

        console.log('Admin privileges removed');
        fetchAdmins();  // Refresh the list of admins
      }
    } catch (err) {
      setError('Error removing admin privileges: ' + err.message);
    } finally {
      setLoading(false);  // Stop loading spinner after the request completes
    }
  };

  // Function to update admin details
  const handleUpdateAdmin = async (uid) => {
    const updatedFirstName = prompt('Enter the new first name:');
    const updatedLastName = prompt('Enter the new last name:');
    const updatedPhotoURL = prompt('Enter the new photo URL (optional):');

    if (!updatedFirstName || !updatedLastName) {
      setError('First name and last name are required');
      return;
    }

    setLoading(true);
    setError(''); // Reset the error message

    try {
      const user = auth.currentUser;  // Get the currently signed-in user
      if (user) {
        const idToken = await user.getIdToken();  // Get the Firebase ID Token

        // API call to update admin details
        await axios.post('http://localhost:8000/update-admin', {
          uid, 
          firstName: updatedFirstName,
          lastName: updatedLastName,
          photoURL: updatedPhotoURL || '',  // Optional photo URL
        }, {
          headers: {
            Authorization: `Bearer ${idToken}`,  // Add token to the Authorization header
          }
        });

        console.log('Admin updated');
        fetchAdmins();  // Refresh the list of admins
      }
    } catch (err) {
      setError('Error updating admin details: ' + err.message);
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

    fetchSuperAdminEmail();
    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, []);

  return (
    <div className="container">
      <div className="content-header">
        <h1>Admin Page</h1>
         {superAdminEmail ? <p>{superAdminEmail}</p> : <p>No super admin found</p>}

        {/* Display error or success messages */}
        {error && <p className="error-message">{error}</p>}

        {/* Button to manually fetch admin users */}
        <button onClick={fetchAdmins} disabled={loading}>
          {loading ? 'Loading...' : '🔄'}
        </button>
      </div>

      <div className="admin-content">
        <div className="add-admin">
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
            <div>
              <label htmlFor="firstName">First Name:</label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)} // Update the first name state
                required
              />
            </div>
            <div>
              <label htmlFor="lastName">Last Name:</label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)} // Update the last name state
                required
              />
            </div>
            <div>
              <label htmlFor="photoURL">Photo URL (optional):</label>
              <input
                type="text"
                id="photoURL"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)} // Update the photo URL state
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Adding Admin...' : 'Add Admin'}
            </button>
          </form>
        </div>

        <hr/>

        <div className="admin-list">
          <h2>Admins List</h2>
          {/* List of admin users */}
          <ul>{console.log(admins)}
            {admins.length === 0 ? (
              <li>No admins found.</li>
            ) : (
              admins.map((admin) => (
                <li key={admin.uid}>
                  {console.log(admin)       }
                  <div className="admin-info">
                    <div style={{display:"flex"}}>
                      <img
                        src={admin.photoURL || 'https://via.placeholder.com/50'} // Use placeholder if no photoURL
                        alt={`${admin.firstName} ${admin.lastName}`}
                        className="admin-photo"
                      />

                      <div>
                        <small>{admin.uid}</small><br/>
                        <strong>{admin.firstName} {admin.lastName}</strong><br />
                        <span>{admin.email}</span>
                      </div>
                    </div>

                    <div style={{display:"flex", flexDirection:"column", gap:"8px"}}>
                      <button onClick={() => handleUpdateAdmin(admin.uid)}>Update</button>
                      <button onClick={() => handleRemoveAdmin(admin.uid)}>Remove 
                        {/* <small>Admin Privileges</small> */}
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <hr />

      
    </div>
  );
};

export default AdminPage;
