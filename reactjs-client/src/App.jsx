import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import AddEmployee from './components/AddEmployee';
import Header from './components/Header';
import EmployeeList from './components/EmployeeList';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './components/auth/Login';
import AdminPage from './components/admin/SuperAdminPage';
import Logout from './components/auth/Logout';
import SuperAdminPage from './components/admin/SuperAdminPage';

function App() 
{
  const [token, setToken] = useState(null);
  const [employees, setEmployees] = useState([]);

  const get_users = async () => {
    try 
    {
      const response = await axios.get("http://localhost:8000/api/employees");
      setEmployees(response.data);
    } 
    catch (error) { console.error("Error fetching employees:", error);  }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
      setToken(storedToken);
      
      if (!storedToken) 
      {
        // window.location.href = "/login";  // Redirect if no token
        return;
      }
    
    //get_users();  // Fetch employees if token exists
    }, [token]);  // Run the effect when the token changes

  return (
    <BrowserRouter>
      <div className='EmployeeApp'>
        <Header />
        <hr />
        <Routes>
          <Route path='/login' element={ <Login setToken={setToken} /> } />
          <Route path="/super/admin-dashboard" element={ <SuperAdminPage /> } />
          <Route path="/admin-dashboard" element={ <AdminPage /> } />

          <Route path='/add-employee' element={ <AddEmployee /> } />
          <Route path='/employees' element={ <EmployeeList employees={employees} /> } />
          <Route path='/logout' element={ <Logout /> } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
