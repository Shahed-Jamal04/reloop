# Reloop - Login & Registration System

Complete authentication system for the Reloop project with React frontend and Node.js/Express backend.

## Project Structure

```
reloop/
├── api/                           # Backend (Node.js/Express)
│   ├── routes/
│   │   └── auth.js               # Authentication endpoints
│   ├── db.js                     # Database connection
│   ├── config.js                 # Configuration
│   ├── index.js                  # Main server file
│   ├── package.json
│   └── .env.example              # Environment variables template
│
└── frontend/reloop/              # Frontend (React)
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.js       # Login component
    │   │   ├── RegisterPage.js    # Register component
    │   │   ├── Dashboard.js       # Protected dashboard page
    │   │   └── Auth.css           # Auth pages styles
    │   ├── components/
    │   │   └── ProtectedRoute.js  # Route protection component
    │   ├── context/
    │   │   └── AuthContext.js     # Authentication context & hooks
    │   ├── App.js                 # Main app with routing
    │   └── index.js               # Entry point
    ├── package.json
    ├── .env                       # Environment variables
    └── public/
        └── index.html
```

## Features

✅ **User Registration** - Create new accounts with email and password
✅ **User Login** - Secure login with JWT authentication
✅ **Protected Routes** - Dashboard accessible only to logged-in users
✅ **Password Hashing** - bcryptjs for secure password storage
✅ **JWT Tokens** - Stateless authentication with token expiration
✅ **Role-Based Access** - Support for buyers, sellers, and admins
✅ **Auto Token Verification** - Automatic token verification on app load
✅ **Error Handling** - User-friendly error messages
✅ **Responsive Design** - Works on desktop and mobile devices

## Backend Setup

### Prerequisites
- Node.js 14+
- SQL Server (with database created from the schema)
- ODBC Driver 17 for SQL Server

### Installation & Setup

1. **Install dependencies:**
   ```bash
   cd api
   npm install
   ```

2. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

3. **Update .env with your SQL Server details:**
   ```env
   PORT=5000
   JWT_SECRET=your_secret_key_here
   DB_CONNECTION_STRING=Driver={ODBC Driver 17 for SQL Server};Server=your_server;Database=Reloop;Trusted_Connection=yes;TrustServerCertificate=yes;
   FRONTEND_URL=http://localhost:3000
   ```

4. **Configure Database Connection:**
   - Ensure SQL Server is running
   - Database `Reloop` exists with all tables created
   - Run the SQL schema provided

5. **Start the backend server:**
   ```bash
   npm start
   ```

The API will be available at `http://localhost:5000`

## Backend API Endpoints

### Authentication Routes (`/api/auth`)

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "buyer"  // "buyer" or "seller" (default: "buyer")
}

Response: 201 Created
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "buyer"
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "buyer"
  }
}
```

#### Verify Token
```
POST /api/auth/verify
Authorization: Bearer <token>

Response: 200 OK
{
  "valid": true,
  "user": {
    "id": 1,
    "email": "john@example.com",
    "role": "buyer"
  }
}
```

#### Health Check
```
GET /api/health

Response: 200 OK
{
  "status": "Server is running"
}
```

## Frontend Setup

### Prerequisites
- Node.js 14+
- npm or yarn

### Installation & Setup

1. **Install dependencies:**
   ```bash
   cd frontend/reloop
   npm install
   ```

2. **Verify .env file:**
   ```bash
   cat .env
   # Should contain: REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

The app will open at `http://localhost:3000`

## Frontend Pages

### Login Page (`/login`)
- Email and password input
- Validation and error handling
- Link to register and forgot password pages
- Redirects to dashboard on success

### Register Page (`/register`)
- Full name, email, phone input
- Account type selection (buyer/seller)
- Password confirmation
- Input validation
- Redirects to login on success

### Dashboard (`/dashboard`) - Protected Route
- Displays user information
- Quick action cards (Listings, Cart, Messages, Settings)
- Logout button
- Auto-redirects to login if not authenticated

## Usage Examples

### User Flow - Registration

1. Click "Register" on login page
2. Fill in registration form:
   - Full Name
   - Email
   - Phone (optional)
   - Account Type
   - Password & Confirm Password
3. Click "Register"
4. On success, redirected to login page
5. Login with your credentials
6. Redirected to dashboard

### User Flow - Login

1. Navigate to `/login`
2. Enter email and password
3. Click "Login"
4. Token is saved to localStorage
5. Redirected to `/dashboard`
6. Dashboard displays user information

### User Flow - Protected Route

1. Without valid token, accessing `/dashboard` redirects to `/login`
2. Token is automatically verified on app load
3. User stays logged in across page refreshes
4. Logout clears token and redirects to login

## Authentication Flow

```
User Registration
├── User submits form
├── Backend validates input
├── Password hashed with bcryptjs
├── User created in database
├── Profile & cart auto-created
└── User redirected to login

User Login
├── User submits credentials
├── Backend queries user from database
├── Password verified with bcryptjs
├── JWT token generated
├── Token sent to frontend
├── Token stored in localStorage
└── User redirected to dashboard

Protected Route Access
├── App checks localStorage for token
├── Token verified with backend
├── If valid, show protected content
└── If invalid/missing, redirect to login
```

## Database Schema

The system uses these tables:

- **users** - User accounts with email, password, role
- **roles** - User roles (buyer, seller, admin)
- **profiles** - User profile information
- **cart** - Shopping cart per user
- **cart_items** - Items in cart
- And other tables for orders, messages, notifications, etc.

## Security Features

🔒 **Password Security**
- Passwords hashed with bcryptjs (salt rounds: 10)
- Never stored in plain text

🔐 **JWT Tokens**
- 24-hour expiration
- Verified on each protected route
- Stored in localStorage (can be enhanced with HttpOnly cookies)

✅ **Validation**
- Email format validation
- Password length requirements
- Required field validation

🛡️ **CORS**
- Configured to accept requests from frontend
- Prevents cross-origin vulnerabilities

## Troubleshooting

### Backend Connection Issues
```bash
# Check if SQL Server is running
# Verify ODBC Driver 17 is installed
# Test connection string in .env
```

### Token Expiration
- Tokens expire after 24 hours
- User must login again
- Consider implementing refresh tokens for better UX

### CORS Errors
- Ensure FRONTEND_URL in .env matches your frontend URL
- Check browser console for specific errors

### Port Already in Use
```bash
# Change PORT in .env
PORT=5001
```

## Environment Variables

### Backend (.env)
```
PORT=5000                    # Server port
JWT_SECRET=your_secret      # JWT signing secret
DB_CONNECTION_STRING=...    # SQL Server connection
FRONTEND_URL=...            # Allowed frontend URL
```

### Frontend (.env)
```
REACT_APP_API_URL=...       # Backend API URL
```

## Next Steps

After setting up login/registration, you can:

1. **Add Password Reset** - Implement forgot password flow
2. **Add Email Verification** - Send confirmation emails
3. **Add Profile Pages** - User profile management
4. **Add Product Listings** - Create/edit/delete listings
5. **Add Shopping Cart** - Cart management
6. **Add Messaging** - User-to-user messaging
7. **Add Ratings/Reviews** - User ratings and reviews
8. **Add Payment Processing** - Integrate payment gateway

## Support & Documentation

- React Router: https://reactrouter.com/
- Express.js: https://expressjs.com/
- bcryptjs: https://www.npmjs.com/package/bcryptjs
- JWT: https://jwt.io/
- MSSQL Node: https://github.com/tediousjs/node-mssql

## License

This project is part of the Reloop application. See LICENSE file for details.
