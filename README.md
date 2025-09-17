# Report Calculator - Production-Grade Next.js Application

A comprehensive, production-ready report processing and payment management system built with Next.js, TypeScript, Tailwind CSS, and Supabase. Features mobile-first responsive design, real-time notifications, and advanced file processing capabilities.

## 🚀 Features

### Core Functionality
- **Role-Based Access Control** (Admin, Manager, User)
- **Smart File Processing** (HTML and CSV file parsing with intelligent amount extraction)
- **Offline Payment Support** with proof upload (.pdf/.jpg) and manager approval workflow
- **Real-time Dashboard** with comprehensive analytics and filtering
- **Step-wise Upload Flow** with progress tracking and validation
- **Payment Management** with multiple methods and status tracking
- **Report History** with complete audit trail and timeline
- **Real-time Notifications** system with push updates
- **Advanced File Validation** with content analysis
- **Manager Comments** system for rejections and feedback
- **Responsive Design** optimized for mobile-first experience
- **Dark Mode Support** with system preference detection
- **Type-Safe** development with full TypeScript support

### User Features
- Upload HTML reports and CSV data files
- Automatic amount extraction from "Total amount charged" columns
- Step-by-step guided upload process
- Real-time file processing with progress indicators
- Choose between online and offline payment methods
- Upload payment proof for offline payments
- Comprehensive dashboard with filtering and search
- View complete report history and timeline
- Real-time notifications for status updates
- Clear pending payments functionality
- Mobile-optimized interface

### Manager Features
- Review and approve/reject reports
- Approve/reject payment proofs with comments
- Add feedback and rejection reasons
- Bulk operations for efficient management
- Advanced filtering and search capabilities
- Real-time notification management

### Admin Features
- Complete user management
- System-wide analytics and reporting
- User role management
- System configuration and maintenance

## 🛠 Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful SVG icons

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - Backend-as-a-Service platform
- **PostgreSQL** - Robust relational database
- **Row Level Security (RLS)** - Database-level security

### Authentication & Security
- **JWT Tokens** - Secure authentication
- **bcrypt** - Password hashing
- **Role-based permissions** - Granular access control
- **Input validation** - Server-side validation
- **File type restrictions** - Secure file uploads

### File Processing
- **Cheerio** - Server-side HTML parsing
- **PapaParse** - Robust CSV processing
- **Advanced validation** - Content structure analysis
- **Multi-format support** - HTML, CSV file types

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript strict mode** - Enhanced type checking
- **Hot reload** - Fast development experience

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd report-calculator-nextjs
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the database schema (see `database-schema.sql`)
3. Copy your project URL and keys

### 3. Environment Configuration

Create a `.env.local` file with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_SECRET=your_super_secret_jwt_key_minimum_32_characters
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and use the demo credentials:

- **Admin**: admin@company.com / admin123
- **Manager**: manager@company.com / manager123  
- **User**: user@company.com / user123

## Project Structure

```
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── ui/             # Reusable UI components
│   └── layout/         # Layout components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── pages/              # Next.js pages and API routes
│   ├── api/           # API endpoints
│   ├── admin/         # Admin pages
│   ├── manager/       # Manager pages
│   └── user/          # User pages
├── styles/             # Global styles
└── types/              # TypeScript type definitions
```

## 📱 Mobile-First Design

### Responsive Features
- **Adaptive Layouts** - Optimized for all screen sizes
- **Touch-Friendly** - Large touch targets and gestures
- **Progressive Enhancement** - Works on all devices
- **Offline Capabilities** - Core functionality works offline
- **Fast Loading** - Optimized for mobile networks

### UI/UX Enhancements
- **Dark Mode Support** - Automatic system detection
- **Clean Card-Based Layout** - Modern design patterns
- **Intuitive Navigation** - Easy-to-use interface
- **Real-time Feedback** - Instant status updates
- **Accessibility** - WCAG compliant components

## 🔄 File Processing Workflow

### Supported File Types
- **HTML Reports** - Extract amounts from table columns
- **CSV Data Files** - Process structured data
- **Multiple Files** - Batch processing support

### Intelligent Extraction
- **Smart Column Detection** - Finds "Total amount charged" automatically
- **Fallback Strategies** - Multiple parsing approaches
- **Data Validation** - Ensures accuracy and completeness
- **Error Recovery** - Handles malformed files gracefully

### Processing Pipeline
1. **File Upload** - Secure multi-file upload
2. **Validation** - Content and structure analysis
3. **Parsing** - Intelligent data extraction
4. **Calculation** - Automatic amount totaling
5. **Review** - User verification step
6. **Submission** - Final processing and approval

## 💳 Payment System

### Online Payments
- **Instant Processing** - Real-time payment gateway
- **Multiple Methods** - Credit card, UPI, Net Banking
- **Secure Transactions** - PCI DSS compliant
- **Transaction History** - Complete audit trail

### Offline Payments
- **Proof Upload** - PDF, JPG, PNG support
- **Manager Approval** - Two-stage verification
- **Status Tracking** - Real-time updates
- **Comment System** - Feedback for rejections

## 📊 Dashboard & Analytics

### User Dashboard
- **Report Status** - Real-time tracking
- **Payment Status** - Current state monitoring
- **Amount Summary** - Financial overview
- **Action Items** - Pending tasks
- **History Timeline** - Complete activity log

### Advanced Filtering
- **Status Filters** - By approval/payment status
- **Date Ranges** - Time-based filtering
- **Search** - Full-text search across reports
- **Sorting** - Multiple sort options

### Manager Features
- **Approval Queue** - Pending reports overview
- **Bulk Actions** - Efficient processing
- **Analytics** - System-wide insights
- **User Management** - Role-based controls

## 🔔 Real-time Notifications

### Notification Types
- **Report Updates** - Status changes
- **Payment Alerts** - Transaction updates
- **System Messages** - Important announcements
- **Deadline Reminders** - Time-sensitive tasks

### Delivery Methods
- **In-App Notifications** - Real-time updates
- **Push Notifications** - Browser notifications
- **Email Alerts** - Important updates
- **SMS Notifications** - Critical messages

### Management Features
- **Read/Unread Status** - Track notification state
- **Filtering Options** - Organize by type/priority
- **Bulk Actions** - Mark all as read
- **Notification History** - Complete archive

## Development

### Building for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Database Schema

The application uses a PostgreSQL database with the following main tables:

- `users` - User accounts with role-based access
- `reports` - Uploaded reports with processing status
- `payments` - Payment tracking and transaction history
- `activity_logs` - Audit trail for all user actions

## Security Features

- Row Level Security (RLS) in Supabase
- JWT token authentication
- Input validation and sanitization
- File type and size restrictions
- Secure password hashing with bcrypt

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the GitHub repository.