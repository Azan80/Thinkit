# SocialApp

A modern social web application built with Next.js, MongoDB, and NextAuth.js. Features include user authentication, post creation with markdown support, voting system, comments, and user profiles.

## 🚀 Features

- **User Authentication**: Email/password and Google OAuth login
- **Post Creation**: Rich markdown content with tags
- **Voting System**: Upvote/downvote posts
- **Comments**: Nested comment system
- **User Profiles**: Public profiles with user posts
- **Tag System**: Filter posts by tags
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Markdown**: React Markdown with remark-gfm
- **Styling**: Tailwind CSS with Typography plugin

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Social
```

2. Install dependencies:
```bash
yarn install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Configure environment variables in `.env.local`:
```env
# MongoDB
MONGODB_URI=mongodb+srv://azanabid2005:dOxTSlasATeEuUCb@cluster0.jgofvua.mongodb.net/social-app

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

5. Run the development server:
```bash
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to your `.env.local`

### MongoDB Setup

The application uses MongoDB Atlas. Make sure your connection string is correct and the database has proper access permissions.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── posts/         # Post CRUD operations
│   │   ├── comments/      # Comment operations
│   │   ├── votes/         # Voting system
│   │   └── users/         # User profiles
│   ├── auth/              # Authentication pages
│   ├── posts/             # Post pages
│   └── profile/           # User profile pages
├── components/             # Reusable components
│   ├── layout/            # Layout components
│   ├── ui/                # UI components
│   └── forms/             # Form components
├── lib/                   # Utility libraries
│   ├── auth.ts            # NextAuth configuration
│   ├── db.ts              # MongoDB connection
│   └── utils.ts           # Helper functions
├── models/                # Mongoose models
│   ├── User.ts
│   ├── Post.ts
│   ├── Comment.ts
│   └── Vote.ts
└── types/                 # TypeScript type definitions
```

## 🗄 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  bio: String,
  avatarUrl: String,
  createdAt: Date
}
```

### Posts Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: String,
  content: String,
  tags: [String],
  upvotes: Number,
  createdAt: Date
}
```

### Comments Collection
```javascript
{
  _id: ObjectId,
  postId: ObjectId (ref: Post),
  userId: ObjectId (ref: User),
  content: String,
  parentId: ObjectId (ref: Comment),
  createdAt: Date
}
```

### Votes Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  postId: ObjectId (ref: Post),
  value: Number (1 or -1),
  createdAt: Date
}
```

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to update these in your production environment:

- `NEXTAUTH_URL`: Your production domain
- `NEXTAUTH_SECRET`: A strong random string
- `MONGODB_URI`: Your production MongoDB connection string

## 🔒 Security Features

- Password hashing with bcryptjs
- Protected API routes with NextAuth session
- Input validation and sanitization
- CORS protection
- Rate limiting (recommended for production)

## 🎨 Customization

### Styling
The app uses Tailwind CSS. You can customize the design by modifying:
- `src/app/globals.css` - Global styles
- `tailwind.config.ts` - Tailwind configuration
- Component-specific classes in each component

### Adding New Features
- Create new API routes in `src/app/api/`
- Add new pages in `src/app/`
- Create reusable components in `src/components/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify your environment variables
3. Ensure MongoDB connection is working
4. Check NextAuth.js configuration

## 🚀 Quick Start Commands

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Run linting
yarn lint
```

---

Built with ❤️ using Next.js, MongoDB, and Tailwind CSS
