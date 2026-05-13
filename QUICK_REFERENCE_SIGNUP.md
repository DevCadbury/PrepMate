# Quick Reference - Production Signup Flow

## 🚀 Quick Start

### Import & Use Signup Flow

```typescript
import SignupFlow from "@/components/SignupFlow";

export default function LandingPage() {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <>
      <button onClick={() => setShowSignup(true)}>
        Sign Up
      </button>
      
      {showSignup && (
        <SignupFlow onClose={() => setShowSignup(false)} />
      )}
    </>
  );
}
```

---

## 📊 API Endpoints Summary

### Signup
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

# Response: 201 Created
{
  "success": true,
  "data": { "email": "...", "emailSent": true }
}
```

### Verify Email
```bash
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification_token_here"
}

# Response: 200 OK
{
  "success": true,
  "data": { "emailVerified": true }
}
```

### Check Username
```bash
GET /api/auth/check-username?username=john_doe

# Response: 200 OK
{
  "available": true
}
```

### Complete Profile
```bash
POST /api/auth/complete-profile
Content-Type: application/json

{
  "email": "user@example.com",
  "token": "verification_token",
  "username": "john_doe",
  "firstName": "John",
  "middleName": "Michael",
  "dateOfBirth": "1990-01-15",
  "role": "student"
}

# Response: 200 OK
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt_token"
  }
}
```

---

## 🎨 Component Props

### SimplifiedSignUpModal
```typescript
<SimplifiedSignUpModal
  onClose={() => {}}  // Called when user closes modal
  onSignupSuccess={(email, token) => {}}  // Called after signup
/>
```

### EmailVerification
```typescript
<EmailVerification
  token="verification_token"  // From email or URL param
  email="user@example.com"
  onVerificationSuccess={(token, email) => {}}  // Proceed to profile
  onVerificationFailure={() => {}}  // Back to signup
/>
```

### ProfileCompletion
```typescript
<ProfileCompletion
  email="user@example.com"
  token="verification_token"
  onProfileComplete={({ token, user }) => {}}  // Success
  onCancel={() => {}}  // Back to signup
/>
```

### SignupFlow (Orchestrator)
```typescript
<SignupFlow
  onClose={() => {}}  // Close entire flow
/>
```

---

## 🔑 Key Features

| Feature | Implementation | Benefit |
|---------|----------------|---------|
| **Debounced Username Check** | 500ms debounce on input | Prevents API spam |
| **Email Verification** | Token-based, 24hr expiry | Confirms email ownership |
| **Auto-Login** | JWT token on profile complete | Seamless UX |
| **Real-time Feedback** | Loading/Available/Taken states | Better UX |
| **Secure Tokens** | SHA256 hashed, time-limited | Security |
| **Role-Based Signup** | No admin in public signup | Access control |

---

## 📱 Responsive Design

All components use Tailwind CSS with responsive classes:
- Mobile: `max-w-md` (on modal)
- Tablet: `p-4` (responsive padding)
- Desktop: Full-screen overlay with centered modal

---

## ⚠️ Error Handling

### Common Errors

**"Account already exists"**
- User already signed up
- Solution: Show "Sign In" button or password reset

**"Invalid or expired verification token"**
- Token older than 24 hours
- Token used twice
- Solution: Resend verification email

**"Username is already taken"**
- Try different username
- Solution: Show alternative suggestions

**"Email not verified" (on login)**
- User didn't verify email
- Solution: Show "Resend verification" button

---

## 🧪 Testing Commands

### Test Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Test Username Check
```bash
curl "http://localhost:5000/api/auth/check-username?username=john_doe"
```

### Test Email Verification
```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN_HERE"}'
```

### Test Profile Completion
```bash
curl -X POST http://localhost:5000/api/auth/complete-profile \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "token": "YOUR_TOKEN_HERE",
    "username": "john_doe",
    "firstName": "John",
    "role": "student"
  }'
```

---

## 🔐 Security Checklist

- ✓ Passwords hashed with bcrypt (12 rounds)
- ✓ Tokens hashed with SHA256 before storage
- ✓ Tokens expire after 24 hours
- ✓ Email verification required before profile
- ✓ Username unique at DB level
- ✓ No admin role in public signup
- ✓ Rate limiting on endpoints (recommended)
- ✓ HTTPS in production

---

## 🚀 Production Deployment

### Environment Variables Required
```bash
# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@iprep mate.com
SMTP_FROM_NAME=iPrepmate

# Frontend
REACT_APP_API_BASE_URL=https://your-api.com
REACT_APP_VERIFY_EMAIL_URL=https://your-frontend.com/verify-email

# Backend
JWT_SECRET=your-long-random-secret-key
NODE_ENV=production
```

### Database Indexes Required
```javascript
// Ensure these indexes exist:
db.users.createIndex({ "email": 1 })  // For signup/login
db.users.createIndex({ "username": 1 }, { sparse: true })  // For username availability
```

---

## 📞 Support Flow for Unverified/Incomplete Users

### Unverified User Tries to Login
```
POST /api/auth/login
↓
Response: 403 Forbidden
{
  "success": false,
  "message": "Email not verified. Please verify your email before signing in.",
  "data": { "canResend": true, "email": "..." }
}
↓
Show: "Resend Verification" button
```

### Verified but Incomplete Profile (if applicable)
```
POST /api/auth/login
↓
Response: 200 OK (login succeeds)
{
  "data": {
    "user": { "isProfileComplete": false, ... },
    "token": "..."
  }
}
↓
Frontend detects isProfileComplete === false
↓
Redirect to profile completion flow
```

---

## 🎯 Performance Tips

1. **Username Check**: Debounce at 500ms (not 300ms)
2. **Email Lookup**: Use indexes on email field
3. **Token Verification**: Use hashed token comparison (O(1))
4. **Profile Data**: Return minimal fields initially
5. **Frontend**: Lazy load ProfileCompletion component

---

## 📚 Related Documentation

- [PRODUCTION_SIGNUP_FLOW.md](./PRODUCTION_SIGNUP_FLOW.md) - Full technical documentation
- [SIGNUP_IMPLEMENTATION_SUMMARY.md](./SIGNUP_IMPLEMENTATION_SUMMARY.md) - Implementation details
- Backend: `prepmate-backend/routes/auth.js`
- Frontend: `prepmate-landing/src/components/`

---

## ❓ FAQ

**Q: Can user skip profile completion?**
A: Current implementation requires it. To make optional, set `isProfileComplete` default to `true` and allow login.

**Q: How to resend verification email?**
A: Already implemented at `/api/auth/resend-verification` (exists from earlier implementation).

**Q: Can user change username after signup?**
A: Not in this flow. Would need separate endpoint (recommended: allow once after signup, then disable).

**Q: How long is verification token valid?**
A: 24 hours. Adjustable via `emailVerificationExpires` calculation in User schema.

**Q: What if email service fails?**
A: In dev mode, token is returned in response. In production, log error and show helpful message.

---

## 🔄 Troubleshooting

| Issue | Solution |
|-------|----------|
| Verification email not sent | Check SMTP credentials in .env |
| Username check always returns unavailable | Check username index in database |
| Can't complete profile after verification | Verify token hasn't expired (24 hour limit) |
| Auto-login not working | Ensure JWT token returned from backend |
| Redirect after signup not working | Check onSignupSuccess callback in parent |
