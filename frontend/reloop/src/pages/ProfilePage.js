import React from 'react';
import { useAuth } from '../context/AuthContext';

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Profile</h1>
      <p style={{ color: '#5f6b7a' }}>Account information</p>

      <div style={{ background: 'white', border: '1px solid rgba(44, 62, 80, 0.12)', borderRadius: 14, padding: 16, maxWidth: 640 }}>
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
      </div>
    </div>
  );
}

export default ProfilePage;

