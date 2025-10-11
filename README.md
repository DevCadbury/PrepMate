# PrepMate - AI-Powered Interview Preparation Platform

A comprehensive SaaS EdTech platform for interview preparation with AI-powered mock interviews, coding practice, social features, and role-based dashboards.

## 🚀 Features

### Core Features

- **Authentication & Role-Based Access**: Email/password and Google OAuth for students, HR, teachers, support, and admins
- **AI-Powered Mock Interviews**: GPT-4 powered interview simulations
- **Coding Practice**: Interactive coding challenges and assessments
- **Social Community**: Posts, likes, comments, following system
- **Real-time Chat & Calls**: 1-on-1 messaging and video calls
- **Test System**: Comprehensive assessment and evaluation
- **Analytics Dashboard**: User progress and performance tracking

### Role-Based Dashboards

- **Student Dashboard**: Learning roadmap, practice sessions, social features
- **Teacher/HR Dashboard**: Student management, content creation, analytics
- **Support Dashboard**: Customer support tools and ticket management
- **Admin Dashboard**: User management, system settings, analytics

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Heroicons** for icons

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Passport.js** for Google OAuth
- **Socket.IO** for real-time features
- **OpenAI API** for AI features
- **Cloudinary** for file uploads

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the Repository

```bash
git clone <repository-url>
cd project
```

### 2. Backend Setup

```bash
cd prepmate-backend

# Install dependencies
npm install

# Create .env file (copy from env.example)
cp env.example .env

# Update .env with your configuration
# - MongoDB URI
# - JWT secrets
# - Google OAuth credentials
# - OpenAI API key
# - Cloudinary credentials

# Setup default admin user
npm run setup-admin

# Start the server
npm run dev
```

### 3. Frontend Setup

```bash
cd prepmate-landing

# Install dependencies
npm install

# Start the development server
npm start
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `prepmate-backend` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=your-mongodb-connection-string

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 👥 Default Users

### Admin User

- **Email**: admin@prepmate.com
- **Password**: admin123
- **Role**: admin
- **Permissions**: Full system access

### Test Users

Run `npm run seed-users` to create sample users for testing.

## 🚀 Usage

### Access Points

- **Landing Page**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin
- **Student Dashboard**: http://localhost:3000/student-dashboard
- **Teacher Dashboard**: http://localhost:3000/teacher-dashboard
- **HR Dashboard**: http://localhost:3000/hr-dashboard
- **Support Dashboard**: http://localhost:3000/support-dashboard

### API Endpoints

- **Authentication**: `/api/auth/*`
- **Admin**: `/api/admin/*`
- **Student**: `/api/student/*`
- **Teacher**: `/api/teacher/*`
- **Social**: `/api/social/*`

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions system
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: API rate limiting for security
- **CORS Protection**: Cross-origin resource sharing configuration
- **Input Validation**: Express-validator for request validation

## 🐛 Troubleshooting

### Common Issues

1. **"user.getSignedJwtToken is not a function"**

   - Ensure the User model is properly compiled
   - Check that all environment variables are set
   - Restart the server

2. **MongoDB Connection Issues**

   - Verify your MongoDB URI in the .env file
   - Ensure MongoDB is running
   - Check network connectivity

3. **Google OAuth Issues**

   - Verify Google OAuth credentials in .env
   - Check callback URLs in Google Console
   - Ensure CORS is properly configured

4. **Frontend API Errors**
   - Verify backend is running on port 5000
   - Check CORS configuration
   - Ensure API endpoints are correct

### Debug Commands

```bash
# Check backend logs
cd prepmate-backend && npm run dev

# Check frontend logs
cd prepmate-landing && npm start

# Test API endpoints
curl http://localhost:5000/health

# Reset admin user
cd prepmate-backend && npm run setup-admin
```

## 📁 Project Structure

```
project/
├── prepmate-backend/          # Backend API
│   ├── models/               # Mongoose models
│   ├── routes/               # API routes
│   ├── middleware/           # Custom middleware
│   ├── utils/                # Utility functions
│   ├── socket/               # Socket.IO handlers
│   └── scripts/              # Setup scripts
├── prepmate-landing/         # Frontend React app
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── dashboards/       # Dashboard components
│   │   └── utils/            # Frontend utilities
│   └── public/               # Static assets
└── README.md                 # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the troubleshooting section
- Review the documentation

---

**PrepMate** - Empowering students with AI-driven interview preparation.
