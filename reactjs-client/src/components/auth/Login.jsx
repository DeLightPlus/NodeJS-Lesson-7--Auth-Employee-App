import React, { useState } from "react";
import { auth } from "../../firebase/config";  // Correct import for auth
import { signInWithEmailAndPassword } from "firebase/auth";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './auth.css'; // Import CSS for styling
import '../admin/admin.css'; // Import CSS for styling

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

    try {
      // Log in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Send the Firebase ID token to the backend for validation
      const response = await axios.post("http://localhost:8000/login", {}, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      // If backend returns a custom token, store it
      if (response.data.token) 
      {
        // Save the token in localStorage
        localStorage.setItem("authToken", response.data.token);

        setToken(response.data.token); // Save the token for further use
        console.log(response.data.role);
        
        alert("Login successful!");

        if(response.data.role==="admin")          
          navigate("/admin-dashboard");
        else if(response.data.role==="sysadmin")
          navigate("/super/admin-dashboard");    
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
      { setError(`Login failed: ${error.response.data || error.message}`); } 
      else { setError("Login failed. Please check your internet connection and try again."); }
    } 
    finally { setLoading(false); }
  };

  return (
    <div className="login-form-container">
      <div className="login-form-card">
        <h2 className="login-form-title">Welcome Back</h2>

        <form onSubmit={handleLogin}>
          <div className="login-form-input-group">
            <label htmlFor="email" className="login-form-label">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-form-input"
              required
            />
          </div>

          <div className="login-form-input-group">
            <label htmlFor="password" className="login-form-label">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-form-input"
              required
            />
          </div>

          <button type="submit" className="login-form-submit-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {error && <p className="login-form-error">{error}</p>}

        <div className="login-form-divider">or sign in with Google</div>

        <button className="login-form-button">
          <img
            aria-hidden="true"
            alt="Google logo"
            src="https://openui.fly.dev/openui/google.svg?text=G"
            className="google-icon"
          />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
