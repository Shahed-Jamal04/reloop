import React from 'react';
import LoginForm from '../components/LoginForm';
import './Auth.css';

export function LoginPage() {
  return (
    <div className="auth-container">
      <LoginForm />
    </div>
  );
}

export default LoginPage;
