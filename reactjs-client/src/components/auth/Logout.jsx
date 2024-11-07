// src/components/Logout.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken"); // Remove token from localStorage
    navigate("/login"); // Redirect to login page
  };

  return (
    <div>
        Are you sure you want to logout?<br/>
      <button onClick={handleLogout}>Logout</button> | <button onClick={()=>{location.href="/admin"}}>Go Back</button>
    </div>
  );
};

export default Logout;
