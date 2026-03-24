import React from 'react';
import RegisterForm from '../components/RegisterForm';
import './Auth.css';

export function RegisterPage() {
  return (
    <div className="auth-container">
      <RegisterForm />
    </div>
  );
}

export default RegisterPage;
