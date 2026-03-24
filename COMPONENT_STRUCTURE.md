# React Components Structure

## Component Organization

The frontend has been refactored into modular, reusable components with clear separation of concerns.

### Component Hierarchy

```
src/
├── pages/
│   ├── LoginPage.js              # Login page container
│   ├── RegisterPage.js           # Register page container  
│   ├── Dashboard.js              # Dashboard page
│   ├── Auth.css                  # Auth pages styling
│   └── Dashboard.css             # Dashboard styling
│
├── components/
│   ├── FormInput.js              # Reusable form input component
│   ├── FormSelect.js             # Reusable form select component
│   ├── ErrorMessage.js           # Error display component
│   ├── Button.js                 # Reusable button component
│   ├── LoginForm.js              # Login form container
│   ├── RegisterForm.js           # Register form container
│   └── ProtectedRoute.js         # Route protection wrapper
│
├── context/
│   └── AuthContext.js            # Authentication state & hooks
│
├── App.js                        # Main app with routing
└── index.js                      # Entry point
```

## Component Descriptions

### Base/Utility Components

#### FormInput.js
Reusable input field component with label support.
```jsx
<FormInput
  label="Email Address"
  id="email"
  name="email"
  type="email"
  value={email}
  onChange={handleChange}
  placeholder="your@email.com"
  required
  disabled={false}
/>
```

#### FormSelect.js
Reusable select dropdown component.
```jsx
<FormSelect
  label="Account Type"
  id="role"
  name="role"
  value={role}
  onChange={handleChange}
  options={[
    { value: 'buyer', label: 'Buyer' },
    { value: 'seller', label: 'Seller' }
  ]}
  disabled={false}
/>
```

#### ErrorMessage.js
Display error messages conditionally.
```jsx
<ErrorMessage message={error} />
```

#### Button.js
Reusable button component with custom styling.
```jsx
<Button type="submit" disabled={loading}>
  Login
</Button>
```

### Form Components

#### LoginForm.js
Complete login form with email and password inputs.
- Handles login submission
- Displays errors
- Redirects to dashboard on success
- Uses FormInput, ErrorMessage, Button components

#### RegisterForm.js
Complete registration form with all fields.
- **REGISTER BUTTON DOES NOTHING** (as requested)
- Name, email, phone, role, password inputs
- Uses FormInput, FormSelect, ErrorMessage, Button components
- Form can be filled but submit does nothing

### Page Components

#### LoginPage.js
Page container for login. Simply wraps LoginForm.

#### RegisterPage.js
Page container for registration. Simply wraps RegisterForm.

#### Dashboard.js
Protected page showing user info and dashboard widgets.

#### ProtectedRoute.js
Wrapper component that checks authentication before rendering children.

## Key Features

✅ **Modular Components** - Each component has single responsibility
✅ **Reusable Elements** - FormInput, FormSelect, Button used across forms
✅ **Separation of Concerns** - Logic in forms, UI in components
✅ **Easy Maintenance** - Changes to form fields only need updates in FormInput
✅ **Styling Centralized** - Auth.css handles all auth page styling
✅ **Register Button Non-Functional** - Submit does nothing, can be enabled later

## File Structure Summary

- **Pages** (3 files): Container components that use forms
- **Components** (7 files): Reusable UI and form components
- **Context** (1 file): Global auth state management
- **CSS** (2 files): Modular styling

## Benefits of This Structure

1. **Reusability** - FormInput is used everywhere instead of copying HTML
2. **Consistency** - All inputs look and behave the same way
3. **Scalability** - Easy to add new forms or pages
4. **Testability** - Components are isolated and easier to test
5. **Maintainability** - Changes to input styling or behavior in one place
6. **Clarity** - Clear component hierarchy and responsibilities

## Usage Example

To use these components elsewhere:

```jsx
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';

// In your component:
<form onSubmit={handleSubmit}>
  <FormInput
    label="Email"
    id="email"
    name="email"
    type="email"
    value={email}
    onChange={handleChange}
    required
  />
  
  <ErrorMessage message={error} />
  
  <Button type="submit">
    Submit
  </Button>
</form>
```

## Register Button Status

The register button in RegisterForm.js currently:
- Is displayed and styled
- Accepts form input
- Does **NOT** submit the form or call any API
- Simply returns on click

To enable registration later, modify the `handleSubmit` function in RegisterForm.js to call the `register` hook from AuthContext.
