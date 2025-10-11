# 🚀 PrepMate Backend API

A comprehensive Node.js/Express backend for the PrepMate AI-powered interview preparation platform.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Models](#database-models)
- [Real-time Features](#real-time-features)
- [AI Integration](#ai-integration)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)

## ✨ Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- Google OAuth integration
- Role-based access control (Student, Teacher, HR, Admin, Support)
- Email verification
- Password reset functionality

### 🎯 Core Modules

- **User Management**: Profile, preferences, statistics
- **Roadmap System**: Learning paths with progress tracking
- **AI Mock Interviews**: OpenAI-powered interview simulations
- **Coding Practice**: Question bank with company-wise filtering
- **Community Features**: Posts, comments, likes, follows
- **Real-time Chat**: 1-on-1 messaging with typing indicators
- **Video Calls**: WebRTC integration for voice/video calls
- **Test System**: Create and assign assessments
- **Support Tickets**: Customer support management
- **Admin Panel**: User management and analytics
- **Subscription Management**: Payment integration

### 🤖 AI Features

- Dynamic interview question generation
- Real-time answer analysis and feedback
- Voice-to-text transcription (Whisper)
- Text-to-speech synthesis
- Follow-up question generation

### 💳 Payment Integration

- Stripe payment processing
- Razorpay integration
- Subscription management
- Plan upgrades/downgrades

## 🛠 Tech Stack

| Component          | Technology                  |
| ------------------ | --------------------------- |
| **Runtime**        | Node.js                     |
| **Framework**      | Express.js                  |
| **Database**       | MongoDB with Mongoose       |
| **Authentication** | JWT, bcrypt, Google OAuth   |
| **Real-time**      | Socket.IO, WebRTC           |
| **AI/ML**          | OpenAI GPT-4, Whisper, TTS  |
| **File Storage**   | Cloudinary                  |
| **Email**          | SendGrid/Nodemailer         |
| **Payments**       | Stripe, Razorpay            |
| **Caching**        | Redis                       |
| **Queue**          | Bull                        |
| **Logging**        | Winston                     |
| **Validation**     | Express-validator, Joi      |
| **Security**       | Helmet, CORS, Rate limiting |

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd prepmate-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/prepmate

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Email Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@prepmate.com

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payment Configuration
STRIPE_SECRET_KEY=your-stripe-secret-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Redis Configuration
REDIS_URL=redis://localhost:6379
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint                          | Description               |
| ------ | --------------------------------- | ------------------------- |
| POST   | `/api/auth/signup`                | Register new user         |
| POST   | `/api/auth/signin`                | User login                |
| GET    | `/api/auth/google`                | Google OAuth login        |
| POST   | `/api/auth/forgot-password`       | Send password reset email |
| POST   | `/api/auth/reset-password/:token` | Reset password            |
| GET    | `/api/auth/verify-email/:token`   | Verify email address      |
| GET    | `/api/auth/me`                    | Get current user          |

### User Management

| Method | Endpoint                 | Description             |
| ------ | ------------------------ | ----------------------- |
| GET    | `/api/users/profile`     | Get user profile        |
| PUT    | `/api/users/profile`     | Update user profile     |
| GET    | `/api/users/:id`         | Get user by ID          |
| PUT    | `/api/users/preferences` | Update user preferences |

### Roadmap System

| Method | Endpoint                     | Description        |
| ------ | ---------------------------- | ------------------ |
| GET    | `/api/roadmaps`              | Get all roadmaps   |
| GET    | `/api/roadmaps/:id`          | Get roadmap by ID  |
| POST   | `/api/roadmaps`              | Create new roadmap |
| PUT    | `/api/roadmaps/:id`          | Update roadmap     |
| POST   | `/api/roadmaps/:id/enroll`   | Enroll in roadmap  |
| PUT    | `/api/roadmaps/:id/progress` | Update progress    |

### AI Interviews

| Method | Endpoint                     | Description           |
| ------ | ---------------------------- | --------------------- |
| POST   | `/api/interviews/create`     | Create new interview  |
| GET    | `/api/interviews`            | Get user interviews   |
| GET    | `/api/interviews/:id`        | Get interview details |
| POST   | `/api/interviews/:id/start`  | Start interview       |
| POST   | `/api/interviews/:id/answer` | Submit answer         |
| POST   | `/api/interviews/:id/end`    | End interview         |

### Coding Practice

| Method | Endpoint                    | Description                |
| ------ | --------------------------- | -------------------------- |
| GET    | `/api/coding/questions`     | Get coding questions       |
| GET    | `/api/coding/questions/:id` | Get question details       |
| POST   | `/api/coding/submit`        | Submit solution            |
| GET    | `/api/coding/companies`     | Get company-wise questions |

### Community Features

| Method | Endpoint                           | Description         |
| ------ | ---------------------------------- | ------------------- |
| GET    | `/api/community/posts`             | Get community posts |
| POST   | `/api/community/posts`             | Create new post     |
| PUT    | `/api/community/posts/:id`         | Update post         |
| DELETE | `/api/community/posts/:id`         | Delete post         |
| POST   | `/api/community/posts/:id/like`    | Like/unlike post    |
| POST   | `/api/community/posts/:id/comment` | Add comment         |

### Real-time Chat

| Method | Endpoint                       | Description       |
| ------ | ------------------------------ | ----------------- |
| GET    | `/api/chat/rooms`              | Get chat rooms    |
| GET    | `/api/chat/rooms/:id/messages` | Get chat messages |
| POST   | `/api/chat/rooms/:id/messages` | Send message      |

### Admin Panel

| Method | Endpoint                     | Description            |
| ------ | ---------------------------- | ---------------------- |
| GET    | `/api/admin/users`           | Get all users          |
| PUT    | `/api/admin/users/:id`       | Update user            |
| DELETE | `/api/admin/users/:id`       | Delete user            |
| GET    | `/api/admin/analytics`       | Get platform analytics |
| GET    | `/api/admin/support-tickets` | Get support tickets    |

## 🗄 Database Models

### User Model

- Authentication fields (email, password, googleId)
- Profile information (name, avatar, bio, location)
- Role-based access (student, teacher, hr, admin, support)
- Preferences and settings
- Statistics and progress tracking
- Subscription information

### Roadmap Model

- Learning path structure with topics
- Progress tracking and completion status
- Resource links and practice questions
- Difficulty levels and prerequisites

### Interview Model

- AI-generated questions and user answers
- Real-time feedback and scoring
- Voice/video recording support
- Performance analytics

### Chat Model

- Direct messaging between users
- Message history and metadata
- File sharing support
- Read receipts and typing indicators

## 🔄 Real-time Features

### Socket.IO Events

#### Chat Events

- `send_message`: Send a new message
- `new_message`: Receive a new message
- `typing_start`: User started typing
- `typing_stop`: User stopped typing

#### Video Call Events

- `call_offer`: Initiate video call
- `call_answer`: Answer video call
- `call_ice_candidate`: WebRTC signaling
- `call_end`: End video call

#### Presence Events

- `user_online`: User came online
- `user_offline`: User went offline
- `user_presence_updated`: User status changed

## 🤖 AI Integration

### OpenAI Services

- **GPT-4**: Interview question generation and answer analysis
- **Whisper**: Voice-to-text transcription
- **TTS**: Text-to-speech synthesis

### AI Features

- Dynamic question generation based on type and difficulty
- Real-time answer analysis with scoring
- Personalized feedback and suggestions
- Follow-up question generation

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**

   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/prepmate
   ```

2. **Build and Start**

   ```bash
   npm run build
   npm start
   ```

3. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start server.js --name prepmate-backend
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@prepmate.com or create an issue in the repository.

## 🔗 Links

- [Frontend Repository](https://github.com/prepmate/frontend)
- [API Documentation](https://docs.prepmate.com)
- [Deployment Guide](https://docs.prepmate.com/deployment)
- [Contributing Guidelines](CONTRIBUTING.md)
