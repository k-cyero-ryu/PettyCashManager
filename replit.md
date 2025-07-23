# PettyCash Manager

## Overview

PettyCash Manager is a full-stack web application designed to digitize and streamline petty cash management for small-to-medium-sized enterprises. The application provides real-time tracking, role-based approval workflows, and comprehensive audit trails for all petty cash transactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui component system
- **Styling**: Tailwind CSS with custom design tokens for consistent theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL-based session store with connect-pg-simple
- **File Uploads**: Multer middleware for receipt attachments
- **API Design**: RESTful endpoints with role-based access control

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Migrations**: Drizzle Kit for schema migrations
- **Connection**: Neon serverless driver with WebSocket support

## Key Components

### Authentication System
- **Strategy**: Traditional username/password with secure password hashing using scrypt
- **Session Management**: PostgreSQL-backed sessions with 7-day TTL
- **Authorization**: Role-based permissions (custodian, accountant, admin)
- **Security**: HTTP-only cookies, CSRF protection via session secrets

### Transaction Management
- **Core Entity**: Transactions with amount, description, recipient, payment method
- **Approval Workflow**: Multi-level approval based on user roles and amount thresholds
- **Multiple Receipt Support**: Upload multiple receipts per transaction, add receipts to existing transactions
- **File Handling**: Receipt upload with validation (PDF, JPG, PNG, 5MB limit, up to 10 files per upload)
- **Receipt Management**: View, download, and delete receipts with role-based permissions
- **Balance Tracking**: Real-time running balance calculation
- **Status Tracking**: Pending, approved, rejected states with audit trail

### User Management
- **Role System**: Three-tier access (custodian, accountant, admin)
- **User Creation**: Admin-only user provisioning with role assignment
- **Profile Management**: Basic user information with display name generation

### Replenishment System
- **Request Workflow**: Custodian-initiated requests with justification
- **Approval Process**: Accountant/admin approval with comments
- **Balance Integration**: Automatic balance adjustment upon approval

## Data Flow

### Transaction Lifecycle
1. **Creation**: Custodian submits transaction with receipt
2. **Validation**: Server validates data and file uploads
3. **Storage**: Transaction stored with "pending" status
4. **Approval Queue**: Transaction appears in approver dashboard
5. **Review**: Accountant/admin approves, rejects, or requests information
6. **Balance Update**: Approved transactions update running balance
7. **Audit Trail**: All status changes logged with timestamps and approvers

### File Management
1. **Upload**: Files stored in `/uploads` directory with unique names
2. **Multiple Receipts**: Support for multiple receipts per transaction using dedicated receipts table
3. **Late Addition**: Add receipts to existing transactions after initial submission
4. **Validation**: File type and size validation on both client and server (PDF, JPG, PNG, 5MB limit)
5. **Security**: Authenticated access to uploaded files with role-based deletion permissions
6. **Database Relations**: Receipts table with foreign key references to transactions and users

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **passport**: Authentication middleware
- **multer**: File upload handling
- **react-hook-form**: Form state management
- **zod**: Runtime type validation

### Development Tools
- **vite**: Build tool and dev server
- **typescript**: Type safety across the stack
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database migration tool

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles Node.js server to `dist/index.js`
- **Assets**: Static files served from build output directory

### Environment Configuration
- **Development**: Hot reloading with Vite dev server
- **Production**: Express serves static files and API routes
- **Database**: Requires `DATABASE_URL` environment variable for PostgreSQL connection

### File Structure
- **Monorepo**: Client, server, and shared code in single repository
- **Shared Schema**: Database schema and types shared between frontend and backend
- **Path Mapping**: TypeScript path aliases for clean imports (`@/`, `@shared/`)

### Security Considerations
- **Session Security**: HTTP-only cookies with secure flags in production
- **File Upload Security**: Type and size validation, authenticated access
- **Database Security**: Parameterized queries via Drizzle ORM
- **Role-based Access**: Middleware-enforced permissions on all endpoints