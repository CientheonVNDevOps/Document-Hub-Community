# Document Community Hub App

A modern note-taking application built with React, NestJS, Supabase, and Redis. Features include tree folder structure, search functionality, versioning, and real-time collaboration.

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **ShadcnUI** for beautiful, accessible components
- **TanStack Query** for server state management
- **Redux Toolkit** for client state management
- **React Router** for navigation
- **Tailwind CSS** for styling

### Backend
- **NestJS** with TypeScript
- **Supabase** for database and authentication
- **Upstash Redis** for caching and rate limiting
- **JWT** for authentication
- **Swagger** for API documentation

### Database
- **PostgreSQL** (via Supabase)
- **Row Level Security (RLS)** for data protection
- **Full-text search** capabilities
- **Version history** tracking

## 📁 Project Structure

```
├── apps/
│   ├── frontend/          # React frontend application
│   └── backend/           # NestJS backend API
├── database/              # Database schema and migrations
└── package.json           # Root package.json for workspace
```

## 🛠️ Setup Instructions

### Prerequisites
- **Bun** (latest version)
- **Node.js** 18+ (if not using Bun)
- **Supabase** account
- **Upstash Redis** account

### 1. Clone and Install Dependencies

```bash
# Install dependencies for all workspaces
bun install:all
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql` in your Supabase SQL editor
3. Get your Supabase URL and API keys from the project settings

### 3. Environment Configuration

#### Backend Environment
Create `apps/backend/.env`:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Redis
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# JWT
JWT_SECRET=your_jwt_secret_key

# Server
PORT=3001
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

#### Frontend Environment
Create `apps/frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Start Development Servers

```bash
# Start both frontend and backend
bun run dev

# Or start individually
bun run dev:frontend  # Frontend on http://localhost:3000
bun run dev:backend   # Backend on http://localhost:3001
```

## 🎯 Features

### ✅ Implemented
- **Authentication System**
  - User registration and login
  - JWT-based authentication
  - OTP verification with rate limiting
  - Role-based access control (RBAC)

- **Note Management**
  - Create, read, update, delete notes
  - Rich text editing
  - Folder organization with tree structure
  - Full-text search
  - Version history and restoration

- **User Interface**
  - Modern, responsive design
  - Dark/light theme support
  - Real-time updates
  - Intuitive navigation

### 🚧 Planned Features
- **Collaboration**
  - Real-time collaborative editing
  - User permissions and sharing
  - Comments and mentions

- **Advanced Features**
  - File attachments
  - Tags and categories
  - Export/import functionality
  - Mobile app

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/request-otp` - Request OTP
- `POST /auth/verify-otp` - Verify OTP
- `POST /auth/logout` - User logout

### Notes
- `GET /notes` - Get all notes
- `GET /notes/:id` - Get specific note
- `POST /notes` - Create note
- `PATCH /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note
- `GET /notes/search?q=query` - Search notes

### Folders
- `GET /notes/folders` - Get all folders
- `GET /notes/folders/:id` - Get specific folder
- `POST /notes/folders` - Create folder
- `PATCH /notes/folders/:id` - Update folder
- `DELETE /notes/folders/:id` - Delete folder

### Versioning
- `GET /notes/:id/versions` - Get note versions
- `POST /notes/:id/versions/:versionId/restore` - Restore version

## 🗄️ Database Schema

### Tables
- **users** - User accounts and profiles
- **folders** - Hierarchical folder structure
- **notes** - Note content and metadata
- **note_versions** - Version history for notes

### Key Features
- **Row Level Security (RLS)** - Users can only access their own data
- **Full-text search** - PostgreSQL's built-in search capabilities
- **Automatic versioning** - Triggers save note versions on updates
- **Hierarchical folders** - Self-referencing folder structure

## 🚀 Deployment

### Backend Deployment
1. Deploy to your preferred platform (Vercel, Railway, etc.)
2. Set environment variables
3. Ensure database connection is configured

### Frontend Deployment
1. Build the application: `bun run build:frontend`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Update API URL in environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API documentation at `/api/docs` when running locally

---

Built with ❤️ using modern web technologies.
# Taking-Note-Community-CientheonVN