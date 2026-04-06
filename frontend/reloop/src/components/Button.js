import React from 'react';

export function Button({ 
  type = 'button', 
  children, 
  disabled = false, 
  onClick,
  className = 'btn btn-primary fw-bold w-100'
}) {
  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  );
}

export default Button;
