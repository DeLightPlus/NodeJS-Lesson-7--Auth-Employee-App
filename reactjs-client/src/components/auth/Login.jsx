// src/components/Login.js
import React, { useState } from "react";
import { auth } from "../../firebase/config";  // Correct import for auth
import { signInWithEmailAndPassword } from "firebase/auth";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try 
    {
      // Log in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get Firebase ID token
      const idToken = await user.getIdToken();
      

      // Send the Firebase ID token to the backend for validation
      const response = await axios.post("http://localhost:8000/login", {}, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      // If backend returns a custom token, store it
      if (response.data.token) 
      {
        // Save the token in localStorage
        localStorage.setItem("authToken", response.data.token);
        
        setToken(response.data.token); // Save the token for further use
        alert("Login successful!");
         
        // Redirect to the admin page
        navigate("/admin");
      } 
      else 
      {
        setError("Unauthorized access: You do not have the required permissions.");
      }
    } 
    catch (error) 
    {
      console.error("Login Error:", error);
      if (error.response) 
      {
        setError(`Login failed: ${error.response.data || error.message}`);
      } 
      else 
      {
        setError("Login failed. Please check your internet connection and try again.");
      }
    } 
    finally { setLoading(false);  }
  };

  return (
    <div>
      <h1>Login (Super Admin)</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default Login;
