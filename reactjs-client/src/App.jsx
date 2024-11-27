import { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import './App.css';

import { auth } from './firebase/config';

import Header from './components/Header/Header';
import AddEmployee from './components/employees/AddEmployee';

import EmployeeList from './components/employees/EmployeeList';

import Login from './components/auth/Login';
import Logout from './components/auth/Logout';
import SuperAdminPage from './components/admin/SuperAdminPage';
import AdminPage from './components/admin/AdminPage';
import ProtectedRoute from './components/auth/ProtectedRoute';


function App() 
{   
  const [user, setUser] = useState(auth.currentUser);
  const [token, setToken] = useState(null);
  const [employees, setEmployees] = useState([]);

  const get_users = async () => {
    try 
    {
      const response = await axios.get(`http://localhost:8000/api/employees?createdBy=${token}`);
      setEmployees(response.data);
    } 
    catch (error) { console.error("Error fetching employees:", error);  }
  };

  useEffect(() => {
      const storedToken = localStorage.getItem("authToken");
      const _user = JSON.parse( localStorage.getItem("user") );      
      
      if (!storedToken && !_user) 
      {
        // window.location.href = "/login";  // Redirect if no token
        setUser(null)
        return;
      }

      setToken(storedToken);
      setUser(_user)
    
    //get_users();  // Fetch employees if token exists
    }, [token]);  // Run the effect when the token changes

    return (
      <BrowserRouter>
        <div className="EmployeeApp"> 
          {/* { console.log("user", user) } */}
          <Header user={user} />
          <hr />
          <Routes>
            <Route path='/login' element={<Login setToken={setToken} />} />
            
            {/* Protected routes */}
            <Route 
              path="/super/admin-dashboard" 
              element={
                <ProtectedRoute 
                  element={<SuperAdminPage />} 
                  allowedRoles={['sysadmin']} // Only sysadmins can access this route
                />
              }
            />
  
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute 
                  element={<AdminPage />} 
                  allowedRoles={['sysadmin', 'admin']} // Both sysadmin and admin can access
                />
              }
            />
  
            <Route 
              path="/add-employee" 
              element={
                <ProtectedRoute 
                  element={<AddEmployee />} 
                  allowedRoles={['sysadmin', 'admin']} // Only admins or sysadmins can add employees
                />
              }
            />
  
            <Route path='/employees' element={<EmployeeList employees={employees} />} />
            <Route path='/logout' element={<Logout />} />
          </Routes>
        </div>
      </BrowserRouter>
    );
  }
  

export default App;
