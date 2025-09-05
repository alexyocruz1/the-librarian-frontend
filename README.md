# The Librarian Frontend

A modern, beautiful library management system frontend built with Next.js 14, TypeScript, and Tailwind CSS.

## 🎨 Features

- **Modern UI/UX**: Beautiful, responsive design with smooth animations
- **Role-based Access**: Different interfaces for Super Admin, Admin, Student, and Guest
- **Authentication**: Secure JWT-based authentication with refresh tokens
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Dark/Light Theme**: System preference detection with theme switching
- **Real-time Updates**: Live notifications and status updates
- **Accessibility**: WCAG compliant with keyboard navigation support

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Headless UI + Custom components
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios with interceptors
- **State Management**: React Context + Custom hooks
- **Icons**: Heroicons
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Backend API running (see backend README)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd the-librarian-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env.local
   ```
   
   Update the `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
   NEXT_PUBLIC_APP_NAME=The Librarian
   NEXT_PUBLIC_APP_DESCRIPTION=Library Management System
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking

## 🎨 Design System

### Colors
- **Primary**: Blue shades for main actions and branding
- **Secondary**: Gray shades for neutral elements
- **Success**: Green shades for positive actions
- **Warning**: Yellow/Orange shades for caution
- **Error**: Red shades for errors and destructive actions

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: Bold weights with proper hierarchy
- **Body**: Regular weight for readability

### Components
- **Buttons**: Multiple variants (primary, secondary, ghost, etc.)
- **Cards**: Elevated, outlined, and default variants
- **Forms**: Consistent input styling with validation states
- **Badges**: Status indicators with semantic colors
- **Modals**: Accessible modal dialogs
- **Tables**: Responsive data tables

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔐 Authentication Flow

1. **Login/Register**: Users authenticate via forms
2. **Token Management**: JWT tokens stored securely
3. **Auto-refresh**: Tokens refresh automatically
4. **Route Protection**: Protected routes redirect to login
5. **Role-based Access**: Different UI based on user role

## 🎭 User Roles & Permissions

### Super Admin
- Full system access
- Create/manage libraries
- Create/manage admins
- System-wide reports
- All user management

### Admin
- Manage assigned libraries
- Approve/reject students
- Manage books and copies
- Library-specific reports
- User management (limited)

### Student
- Browse books
- Request book borrowing
- View personal history
- Profile management

### Guest
- Browse books
- Request book borrowing
- No personal history
- Can request student upgrade

## 🧩 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   └── ui/               # Base UI components
├── context/              # React Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## 🎨 Customization

### Theme Colors
Edit `tailwind.config.js` to customize the color palette:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your primary color shades
      },
      // Other color variants
    }
  }
}
```

### Component Variants
Components use `class-variance-authority` for consistent variants:

```typescript
const buttonVariants = cva(
  'base-classes',
  {
    variants: {
      variant: {
        primary: 'primary-classes',
        secondary: 'secondary-classes',
      }
    }
  }
);
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render

### Environment Variables for Production
```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
NEXT_PUBLIC_APP_NAME=The Librarian
NEXT_PUBLIC_APP_DESCRIPTION=Library Management System
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (when implemented)
npm run test:e2e
```

## 📚 API Integration

The frontend communicates with the backend API through:
- **Base URL**: Configurable via environment variables
- **Authentication**: JWT tokens in Authorization header
- **Error Handling**: Consistent error responses
- **Type Safety**: Full TypeScript integration

## 🔧 Development

### Adding New Pages
1. Create page component in `src/app/`
2. Add route to navigation in `src/app/dashboard/layout.tsx`
3. Update types in `src/types/index.ts` if needed

### Adding New Components
1. Create component in `src/components/`
2. Export from appropriate index file
3. Add to storybook (if implemented)

### Styling Guidelines
- Use Tailwind CSS classes
- Follow the design system
- Use semantic color names
- Ensure accessibility compliance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the component documentation
- Review the code comments

---

**Happy Coding! 📚✨**
