import { Navigate, Route } from "react-router-dom";

const ProtectedRoute = ({ element, allowedRoles, ...rest }) => {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('adminRole');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If the user has a role and it's not in the allowed roles, redirect to another page (e.g., home or forbidden)
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // Return the element for the protected route if all checks pass
  return element;
}

export default ProtectedRoute;
