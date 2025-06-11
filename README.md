# TasteMonash Backend

A Node.js RESTful API server for the TasteMonash restaurant discovery platform. Provides secure authentication, review management, business operations, and automated deal management for the Monash University dining community.

## Features

### Core API Functionality
- RESTful API design with Express.js
- Role-based authentication (customers vs business owners)
- Anonymous review system with multi-criteria ratings
- Restaurant and business management
- Image upload and cloud storage integration
- Search and filtering capabilities with pagination

### Authentication & Security
- PassportJS authentication strategy
- Session management with MongoDB storage
- Encrypted authentication cookies
- Role-based access control middleware
- Input validation and sanitization

### Automated Systems
- Scheduled jobs for deal expiration management
- Database indexing for optimized queries
- Error handling and logging
- File upload processing with Multer

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: PassportJS
- **File Upload**: Multer
- **Cloud Storage**: Cloudinary
- **Job Scheduling**: Node-cron
- **Environment**: dotenv

## Prerequisites

- Node.js (version 16 or higher)
- MongoDB (local installation or cloud instance)
- npm or yarn package manager
- Cloud storage account (for image uploads)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Nutty1704/eprp-backend.git
cd eprp-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.sample .env
```

4. Configure environment variables in `.env`:

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Production

Start the production server:
```bash
npm start
```

## Contributing

1. Follow existing code organization patterns
2. Maintain RESTful API conventions
3. Add appropriate middleware for new routes
4. Include proper error handling
