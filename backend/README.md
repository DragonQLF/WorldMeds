# WorldMeds Backend API

This is the backend API for the WorldMeds Index application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create the database:
```bash
mysql -u root -p < init.sql
```

3. Add the profile picture column to the users table:
```bash
mysql -u worldmeds_user -p worldmeds_db < migrations/add_profile_picture.sql
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. Protected routes require an `Authorization` header with a Bearer token.

```
Authorization: Bearer your-jwt-token
```

## API Endpoints

### Auth Routes

- `POST /api/signup` - Register a new user
  - Request body: `{ firstName, lastName, email, password }`
  - Response: `{ success, message, user, token }`

- `POST /api/login` - Login
  - Request body: `{ email, password }`
  - Response: `{ success, message, user, token }`

- `POST /api/forgot-password` - Request password reset
  - Request body: `{ email }`
  - Response: `{ success, message }`

### User Routes (Protected)

All these routes require authentication.

- `GET /api/profile` - Get current user profile
  - Response: `{ success, user }`

- `PUT /api/profile` - Update user profile
  - Request body: `{ firstName, lastName, email }`
  - Can also include form data with a `profilePicture` file
  - Response: `{ success, message, user }`

- `POST /api/upload-profile-picture` - Upload a profile picture
  - Request: Form data with a `profilePicture` file
  - Response: `{ success, message, profilePicture }`

- `PUT /api/change-password` - Change password
  - Request body: `{ currentPassword, newPassword }`
  - Response: `{ success, message }`

## Middlewares

- `authenticate` - Verifies JWT token and attaches user to request
- `multer` - Handles file uploads

## Models

- `User` - User model with methods for CRUD operations

## Controllers

- `authController` - Handles authentication (register, login, forgot password)
- `userController` - Handles user operations (profile, upload, password change)

## File Structure

```
backend/
  ├── config.js            # Configuration settings
  ├── db.js                # Database connection
  ├── server.js            # Main server file
  ├── index.js             # Entry point
  ├── init.sql             # Database initialization
  ├── models/
  │   └── User.js          # User model
  ├── controllers/
  │   ├── authController.js # Authentication controller
  │   └── userController.js # User controller
  ├── middleware/
  │   └── auth.js          # Authentication middleware
  ├── routes/
  │   ├── authRoutes.js    # Authentication routes
  │   └── userRoutes.js    # User routes
  ├── migrations/
  │   └── add_profile_picture.sql # Migration to add profile picture column
  └── public/
      └── uploads/         # Uploaded files
          └── profile-pictures/ # Profile pictures
``` 