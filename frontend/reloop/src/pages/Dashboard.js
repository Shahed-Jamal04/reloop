import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">Reloop</div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h1>Welcome, {user?.name}! 👋</h1>
          <p>Email: {user?.email}</p>
          <p>Role: <span className="badge">{user?.role}</span></p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>📦 Listings</h3>
            <p>View and manage your listings</p>
            <button>Go to Listings</button>
          </div>

          <div className="dashboard-card">
            <h3>🛒 Shopping Cart</h3>
            <p>Check your cart items</p>
            <button>Go to Cart</button>
          </div>

          <div className="dashboard-card">
            <h3>💬 Messages</h3>
            <p>View your messages</p>
            <button>Go to Messages</button>
          </div>

          <div className="dashboard-card">
            <h3>⚙️ Settings</h3>
            <p>Manage your account settings</p>
            <button>Go to Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
