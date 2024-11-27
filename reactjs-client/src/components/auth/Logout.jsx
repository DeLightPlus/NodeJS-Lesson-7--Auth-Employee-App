// src/components/Logout.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken"); 
    localStorage.removeItem("user");

    window.location.href = "/login"; 
  };

  return (
    <div>
        Are you sure you want to logout?<br/>
      <button onClick={handleLogout}>Logout</button> | <button onClick={()=>{location.href="/admin"}}>Go Back</button>
    </div>
  );
};

export default Logout;
