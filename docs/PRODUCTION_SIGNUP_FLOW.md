# Production-Grade Signup & Onboarding Flow

## Overview

This document outlines the complete signup and onboarding flow for iPrepmate, designed to be production-ready with proper email verification, username availability checking, and profile completion handling.

## Architecture

### Database Schema Updates

**User Model Changes:**
- `username`: Now optional with sparse unique index (set during profile completion)
- `name`: Now optional (set during profile completion)
- `emailVerified`: Boolean flag (default: false)
- `isProfileComplete`: Boolean flag (default: false)
- `emailVerificationToken`: Stores hashed verification token
- `emailVerificationExpires`: Token expiry timestamp

### Multi-Step Flow

```
User starts → Signup (email/password) 
    ↓
    → Check if account exists
    ↓
    Yes? → Show error "Account already exists"
    No? → Create inactive user + send verification email
    ↓
    → Email Verification
    ↓
    → User clicks link (frontend captures token)
    ↓
    → Frontend verifies token with backend
    ↓
    → Profile Completion Form
    ↓
    → Username availability check (debounced)
    ↓
    → User submits: firstName, username, role, dateOfBirth
    ↓
    → Backend creates account fully
    ↓
    → Auto-login user (return JWT token)
    ↓
    → Redirect to dashboard
```

## API Endpoints

### 1. Simplified Signup (Email + Password Only)

**Endpoint:** `POST /api/auth/signup`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Signup successful. Please verify your email to continue.",
  "data": {
    "email": "user@example.com",
    "emailSent": true,
    "verificationTokenDev": "token..." // Only in dev mode if email fails
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Account already exists. Please login.",
  "errors": [...]
}
```

**Validations:**
- Email must be valid and unique
- Password: min 8 chars, uppercase, lowercase, number
- Account must not already exist

---

### 2. Email Verification

**Endpoint:** `POST /api/auth/verify-email`

**Request:**
```json
{
  "token": "verification_token_from_email"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Email verified successfully. Please complete your profile to continue.",
  "data": {
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Invalid or expired verification token. Please request a new one."
}
```

**Frontend Flow:**
1. Email contains link: `https://yourfrontend.com/verify-email?token=...`
2. Frontend captures token from URL query param
3. Frontend calls `/verify-email` endpoint
4. Shows success/error UI
5. On success, redirects to profile completion

---

### 3. Username Availability Check

**Endpoint:** `GET /api/auth/check-username?username=...`

**Response (Available - 200):**
```json
{
  "available": true
}
```

**Response (Taken - 200):**
```json
{
  "available": false,
  "reason": "Username is already taken"
}
```

**Features:**
- Uses indexed username field for fast queries
- Format validation (3-30 chars, alphanumeric + underscore)
- **Frontend debounces** requests (500ms) to avoid hammering API
- Real-time feedback: "Checking...", "Available ✓", "Taken ✗"

---

### 4. Profile Completion

**Endpoint:** `POST /api/auth/complete-profile`

**Request:**
```json
{
  "email": "user@example.com",
  "token": "verification_token",
  "username": "john_doe",
  "firstName": "John",
  "middleName": "Michael", // optional
  "dateOfBirth": "1990-01-15", // optional ISO8601
  "role": "student" // student | teacher | hr
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Profile completed successfully!",
  "data": {
    "user": {
      "id": "mongo_id",
      "email": "user@example.com",
      "username": "john_doe",
      "name": "John Michael",
      "role": "student",
      "emailVerified": true,
      "isProfileComplete": true
    },
    "token": "jwt_token_for_auto_login"
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Username is already taken. Please choose another.",
  "errors": [...]
}
```

**Validations:**
- Email + token must match stored record and be non-expired
- Username: unique, 3-30 chars, alphanumeric + underscore only
- First name: required
- Date of birth: optional, must result in age 13-100
- Role: must be one of [student, teacher, hr]

---

### 5. Enhanced Login Response

**Endpoint:** `POST /api/auth/login` (existing)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "mongo_id",
      "username": "john_doe",
      "name": "John Michael",
      "email": "user@example.com",
      "role": "student",
      "emailVerified": true,
      "isProfileComplete": true,
      "profilePicture": "...",
      "profile": {...},
      "progress": {...},
      "metrics": {...}
    },
    "token": "jwt_token"
  }
}
```

**Response (Unverified Email - 403):**
```json
{
  "success": false,
  "message": "Email not verified. Please verify your email before signing in.",
  "data": {
    "canResend": true,
    "email": "user@example.com"
  }
}
```

**Frontend Logic:**
```typescript
if (response.status === 403) {
  if (data.data?.canResend) {
    // Show "Please verify your email" + "Resend verification" button
  }
} else {
  // Login successful
  if (data.data.user.isProfileComplete) {
    // Redirect to dashboard
  } else {
    // Redirect to profile completion
    // (Pass token so user can complete profile without re-verifying)
  }
}
```

---

## Frontend Components

### 1. **SimplifiedSignUpModal.tsx**
- Email input
- Password (with show/hide toggle)
- Confirm password
- Submit button
- Calls `/auth/signup`
- On success: emits event with email and token (for dev mode)

### 2. **EmailVerification.tsx**
- Receives token and email as props
- Shows loading state
- Calls `/auth/verify-email`
- On success: shows checkmark, redirects after 2s
- On error: shows error message, redirects after 3s

### 3. **ProfileCompletion.tsx**
- First name input (required)
- Middle name input (optional)
- Username input with debounced availability check
- Real-time feedback: "Checking...", "Available ✓", "Taken ✗"
- Date of birth picker (optional)
- Role selector: Student / Teacher / HR
- Form disabled until username is confirmed available
- Calls `/auth/complete-profile`
- On success: auto-login, redirect to dashboard

### 4. **SignupFlow.tsx** (Orchestrator)
- Manages state: signup → verification → profile → complete
- Handles transitions between screens
- Stores email/token in state
- Passes data to child components
- Integrates with AuthContext for token storage and login

---

## Frontend Routes

```
/signup → Shows SignupFlow component (multi-step modal)
/verify-email?token=... → SignupFlow receives token from URL
/dashboard → Main app (after all steps complete)
```

---

## Security Considerations

### Email Verification Tokens
- Generated using `crypto.randomBytes(32)`
- Hashed with SHA256 before storage
- Expire after 24 hours
- Verified against hashed token, not plain token

### Password Security
- Minimum 8 characters
- Must contain uppercase, lowercase, number
- Hashed with bcrypt (12 rounds) before storage

### Username Uniqueness
- Enforced via MongoDB unique sparse index
- Case-insensitive (stored as lowercase)
- Regex validation: `^[a-zA-Z0-9_]+$`

### CORS & HTTPS
- Ensure email verification links are HTTPS
- Frontend only accepts from allowed origins
- Consider implementing rate limiting on signup/verification endpoints

---

## Performance Optimizations

### Backend
- Indexed queries for email and username
- Lean queries for availability checks
- Token expiry prevents DB bloat
- Minimal payload responses

### Frontend
- Username availability check: 500ms debounce
- Avoid API calls on every keystroke
- Lazy load components on route change
- Use React.memo for child components

---

## Error Handling

| Scenario | HTTP Status | Message |
|----------|------------|---------|
| Account exists | 400 | Account already exists. Please login. |
| Invalid email | 400 | Please provide a valid email |
| Weak password | 400 | Password must contain uppercase, lowercase, number |
| Invalid token | 400 | Invalid or expired verification token |
| Username taken | 400 | Username is already taken |
| Email not verified (login) | 403 | Email not verified. Please verify your email |

---

## Testing Checklist

### Signup
- [ ] Create account with valid email/password
- [ ] Reject duplicate email
- [ ] Reject weak password
- [ ] Email sent successfully
- [ ] Dev mode shows token for testing

### Email Verification
- [ ] Token from email works
- [ ] Expired token rejected
- [ ] Invalid token rejected
- [ ] Can't use same token twice

### Profile Completion
- [ ] Username availability API works
- [ ] Debouncing prevents spam requests
- [ ] Duplicate username rejected
- [ ] Form validates all required fields
- [ ] Auto-login on completion
- [ ] JWT token stored and valid

### Login
- [ ] Unverified users can't login (403)
- [ ] Incomplete profile detected
- [ ] Frontend redirects appropriately
- [ ] `isProfileComplete` flag used

---

## Future Enhancements

1. **OAuth Integration**: Google/GitHub signup
2. **Profile Picture Upload**: Add to profile completion
3. **Email Resend**: Rate-limited resend endpoint
4. **Two-Factor Authentication**: Optional 2FA setup
5. **Social Onboarding**: Connect social profiles
6. **Analytics**: Track signup funnel conversion
7. **A/B Testing**: Test different signup flows

---

## Deployment Checklist

- [ ] SMTP configured for production
- [ ] Email verification links use production domain
- [ ] Environment variables set (SMTP, JWT_SECRET, etc.)
- [ ] Rate limiting configured
- [ ] CORS allowlist updated
- [ ] Database indexes created
- [ ] Error logging configured
- [ ] Email templates branded
- [ ] Redirect URLs updated
- [ ] SSL/HTTPS enforced
