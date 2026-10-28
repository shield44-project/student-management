# Student Management System (Full Stack)

A modern, responsive full-stack student management application and academic administration workspace built with **Node.js, Express, MongoDB (Mongoose), JWT authentication, and Vanilla HTML5/CSS3/JavaScript**.

---

## Table of Contents
1. [Features](#features)
2. [Technology Stack](#technology-stack)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Installation Guide](#step-by-step-installation-guide)
5. [Environment Configuration (`.env`)](#environment-configuration-env)
6. [Database Seeding (Admin & Sample Students)](#database-seeding-admin--sample-students)
7. [Running the Application](#running-the-application)
8. [User Roles & Access Control](#user-roles--access-control)
9. [API Documentation](#api-documentation)
10. [Project Architecture](#project-architecture)
11. [Troubleshooting & FAQs](#troubleshooting--faqs)
12. [Deployment (Vercel + MongoDB Atlas)](#deployment-vercel--mongodb-atlas)

---

## Features

- **Student Academic Hub & Services Portal**:
  - **Attendance Guardian & 75% Calculator**: Visual gauge tracking attendance against the university 75% threshold, with an interactive calculator determining how many classes can be safely skipped or must be attended.
  - **Weekly Timetable**: Interactive Monday-to-Friday schedule with periods, locations, and faculty.
  - **Subject-wise Breakdown**: Course-level attendance tracking with shortage warnings.
  - **Campus Notice Board**: Priority exam notices, hackathon announcements, and library alerts.
  - **Academic Downloads**: Instant access to syllabus schemes, academic calendars, and question banks.
- **Student Profile Dossiers**: One-click modal to inspect any student's full academic file (USN, attendance metrics, CGPA, fee status, enrolled courses, and advisor remarks).
- **Dark & White (Light) Mode**: Modern theme toggle (☀️ Light / 🌙 Dark) with smooth transitions, persistent user preference in `localStorage`, and automatic system preference detection.
- **Modern UI & Responsive Design**: Elevated aesthetic with glassmorphism modal dialogs, colorful department pills, live status indicators, pastel avatar gradients, and responsive mobile/desktop layouts.
- **Authentication & Security**: JWT-based stateless authentication, bcrypt password hashing (cost factor 12), Helmet HTTP security headers, CORS origin filtering, and Express rate limiting.
- **Role-Based Access Control (RBAC)**: Distinct permissions for **Administrators** and **Students**.
- **Student Directory**:
  - Real-time search across Name, USN, and Email.
  - Multi-criteria filtering by Department (CSE, ISE, ECE, EEE, ME, CIV, AIML, DS, OTHER), Semester (1–8), and Status (Active, On Leave, Graduated).
  - Paginated table with responsive mobile & desktop UI.
- **Admin Management Operations (CRUD)**:
  - Add new student records with form validation.
  - Edit existing student details directly through interactive modal dialogs.
  - Delete student records with confirmation prompts.
  - One-click CSV export of the full student roster with CSV injection protection.
- **Overview Dashboard**:
  - Metric cards for Total Students, Active Students, Distinct Departments, and Semester Breakdown.
  - Automatic avatar generation with student initials and status badges.
- **Pre-populated Sample Data**: Ready-to-use temporary database seeder with realistic student records.

---

## Technology Stack

- **Backend**: Node.js (v20+), Express.js 4.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Security & Utilities**: `helmet`, `cors`, `compression`, `express-rate-limit`, `morgan`, `dotenv`
- **Frontend**: Responsive Vanilla HTML5, modern CSS3 (Custom Properties & Flexbox/Grid), JavaScript (ES6+ async/await)
- **Deployment**: Vercel serverless function routing (`vercel.json`) + static asset serving

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:

1. **Node.js**: Version 20.x or higher (`node -v`)
2. **npm**: Version 9.x or higher (`npm -v`)
3. **MongoDB**:
   - **Local instance**: MongoDB Community Server running locally on `mongodb://127.0.0.1:27017`
   - **OR Cloud instance**: A free [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI.

---

## Step-by-Step Installation Guide

Follow these steps to set up and run the project from scratch:

### 1. Clone or Open the Repository
```bash
git clone https://github.com/your-username/student-management.git
cd student-management
```

### 2. Install Project Dependencies
Install all required Node.js packages:
```bash
npm install
```

### 3. Create the Environment File
Copy the provided `.env.example` file to create your `.env` configuration:
```bash
cp .env.example .env
```

---

## Environment Configuration (`.env`)

Open `.env` in your text editor and review the configuration:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/student-management_students
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_characters
JWT_EXPIRES_IN=1d
CLIENT_ORIGIN=http://localhost:5000
ADMIN_NAME=Project Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeThisAdminPassword123!
```

### Environment Variables Explained:
| Variable | Description | Default / Example |
|---|---|---|
| `NODE_ENV` | Application environment (`development`, `production`, `test`). | `development` |
| `PORT` | Local port number the web server listens on. | `5000` |
| `MONGODB_URI` | MongoDB connection string. Use local or your Atlas URI. | `mongodb://127.0.0.1:27017/student-management_students` |
| `JWT_SECRET` | Secret key used to sign and verify JWT authentication tokens. **Must be at least 32 characters**. | Long random string |
| `JWT_EXPIRES_IN` | Token expiration period. | `1d` (1 day) |
| `CLIENT_ORIGIN` | Allowed client origin(s) for CORS. Can be comma-separated for multiple URLs. | `http://localhost:5000` |
| `ADMIN_NAME` | Display name of the initial seeded administrator account. | `Project Administrator` |
| `ADMIN_EMAIL` | Login email for the administrator. | `admin@example.com` |
| `ADMIN_PASSWORD` | Password for the administrator. **Must be at least 12 characters**. | `ChangeThisAdminPassword123!` |

---

## Database Seeding (Admin & Sample Students)

The project includes built-in seeding scripts to immediately populate your database with an administrator account and realistic student records.

### Seed Everything with One Command
```bash
npm run seed
```
This runs both the admin seeder and the sample student generator sequentially.

### Individual Seeding Commands:
- **Seed / Update Administrator Only**:
  ```bash
  npm run seed:admin
  ```
  Creates or updates the admin account configured in your `.env` file (`ADMIN_EMAIL` & `ADMIN_PASSWORD`).

- **Seed Sample Students Only**:
  ```bash
  npm run seed:students
  ```
  Populates the database with 18 realistic sample student records across all departments (CSE, ISE, ECE, EEE, ME, CIV, AIML, DS), varied semesters (1 through 8), and statuses (Active, On Leave, Graduated).
  *Note: The script is idempotent; re-running it safely updates records by USN without creating duplicates.*

---

## Running the Application

### Development Mode (with automatic restart on file change)
```bash
npm run dev
```

### Production Mode
```bash
npm run start
```

Once started, open your browser and navigate to:
```
http://localhost:5000
```

---

## User Roles & Access Control

The application implements strict Role-Based Access Control (RBAC):

```
┌─────────────────────────────────────────────────────────────┐
│                      Public User                            │
│  - View login & registration page                           │
│  - Register a new Student account                           │
│  - Sign in                                                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────────┐         ┌───────────────────────────┐
│       Student Role        │         │    Administrator Role     │
│ - View student directory  │         │ - Everything Students can │
│ - Search & filter records │         │ - Add new students        │
│ - View metrics & stats    │         │ - Edit student records    │
│ - View individual records │         │ - Delete student records  │
│                           │         │ - Export directory to CSV │
└───────────────────────────┘         └───────────────────────────┘
```

### 1. Administrator Access
- **How to sign in as Admin**:
  Use the credentials defined in your `.env`:
  - **Email**: `admin@example.com`
  - **Password**: `ChangeThisAdminPassword123!`
- **Admin Capabilities**:
  - The UI displays an **ADMINISTRATOR** badge.
  - Top action buttons: **"＋ Add student"** and **"↓ Export CSV"** are visible and active.
  - Table column **ACTIONS** displays **Edit** and **Delete** buttons for each student.
  - Access to all admin-only REST API endpoints (`POST`, `PUT`, `DELETE`, and `/export.csv`).

### 2. Student Access
- **How to access as a Student**:
  - Click on the **"Create account"** tab on the login screen.
  - Provide Full Name, Email, and Password (minimum 8 characters).
  - Public registration automatically assigns the `student` role.
- **Student Capabilities**:
  - The UI displays a **STUDENT** badge.
  - Full read access to the directory: search, filter, paginate, and view dashboard analytics.
  - Admin-only action buttons and mutation endpoints are hidden and protected with HTTP `403 Forbidden`.

---

## API Documentation

All routes under `/api/students` require authentication via standard Bearer token header:
`Authorization: Bearer <token>`

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Service health status check |
| `POST` | `/api/auth/register` | Public | Register a new student user account |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile |
| `GET` | `/api/students` | Authenticated | List students with search, filters & pagination |
| `GET` | `/api/students/stats` | Authenticated | Get summary metrics and department/semester counts |
| `GET` | `/api/students/:id` | Authenticated | Retrieve details for a single student |
| `POST` | `/api/students` | **Admin Only** | Create a new student record |
| `PUT` | `/api/students/:id` | **Admin Only** | Update an existing student record |
| `DELETE` | `/api/students/:id` | **Admin Only** | Remove a student record |
| `GET` | `/api/students/export.csv` | **Admin Only** | Download full student directory as CSV |

### Query Filter Examples:
- **Pagination**: `/api/students?page=1&limit=8`
- **Keyword Search**: `/api/students?search=Aarav` (matches Name, USN, or Email)
- **Filtered Query**: `/api/students?department=CSE&semester=5&status=Active`

---

## Project Architecture

```
student-management/
├── api/
│   └── index.js              # Server entry point (exports Express app for Vercel/Node)
├── src/
│   ├── app.js                # Express app setup, middleware, CORS, rate limits
│   ├── config/
│   │   └── db.js             # Mongoose connection manager with global connection caching
│   ├── controllers/
│   │   ├── authController.js # Auth handlers (register, login, me)
│   │   └── studentController.js # Student CRUD, metrics aggregation, CSV export
│   ├── middleware/
│   │   ├── auth.js           # JWT verification (protect) & admin role enforcement (adminOnly)
│   │   └── errors.js         # Centralized error handler and 404 handler
│   ├── models/
│   │   ├── Student.js        # Mongoose schema for Student records
│   │   └── User.js           # Mongoose schema for User accounts (Admin & Student)
│   └── routes/
│       ├── authRoutes.js     # /api/auth routing
│       └── studentRoutes.js  # /api/students routing
├── public/
│   ├── index.html            # Single-page application markup & modal dialogs
│   ├── styles.css            # Responsive modern design system
│   └── app.js                # Frontend client logic, state management, API calls
├── scripts/
│   ├── seedAdmin.js          # Admin account provisioning script
│   └── seedStudents.js       # Temporary/sample student dataset seeding script
├── postman/
│   └── Student Management-API.postman_collection.json # API Postman collection
├── .env.example              # Environment variable template
├── package.json              # Project scripts and dependencies
├── vercel.json               # Vercel deployment configuration
└── README.md                 # Project documentation
```

---

## Troubleshooting & FAQs

### 1. `connect ECONNREFUSED 127.0.0.1:27017`
- **Cause**: MongoDB is not running on your local machine.
- **Fix**: Start the MongoDB service.
  - Linux (systemd): `sudo systemctl start mongod`
  - macOS (Homebrew): `brew services start mongodb/brew/mongodb-community`
  - Or use a free cloud database URI from [MongoDB Atlas](https://www.mongodb.com/atlas) in your `.env`.

### 2. `JWT_SECRET must contain at least 32 characters`
- **Cause**: The `JWT_SECRET` in `.env` is too short or missing.
- **Fix**: Open `.env` and set `JWT_SECRET` to a random string with 32 or more characters.

### 3. `Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters) in .env`
- **Cause**: Admin password set in `.env` has fewer than 12 characters.
- **Fix**: Ensure `ADMIN_PASSWORD` in `.env` is at least 12 characters long before running `npm run seed:admin`.

### 4. `EADDRINUSE: address already in use :::5000`
- **Cause**: Another process is already running on port 5000.
- **Fix**: Change `PORT=5001` in `.env` and update `CLIENT_ORIGIN=http://localhost:5001`, or terminate the process using port 5000 (`lsof -i :5000` / `kill <PID>`).

---

## Deployment (Vercel + MongoDB Atlas)

1. **MongoDB Atlas**:
   - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
   - Create a database user and configure Network Access (`0.0.0.0/0` for cloud serverless access).
   - Copy the connection string (e.g. `mongodb+srv://<user>:<password>@cluster.mongodb.net/students?retryWrites=true&w=majority`).

2. **Deploy to Vercel**:
   - Push your code to GitHub (**do not commit your `.env` file**).
   - Import the repository in your Vercel Dashboard.
   - Under **Project Settings → Environment Variables**, add:
     - `NODE_ENV` = `production`
     - `MONGODB_URI` = `<Your MongoDB Atlas URI>`
     - `JWT_SECRET` = `<Random 32+ character secret>`
     - `JWT_EXPIRES_IN` = `1d`
     - `CLIENT_ORIGIN` = `https://your-project.vercel.app`
     - `ADMIN_NAME` = `Project Administrator`
     - `ADMIN_EMAIL` = `admin@example.com`
     - `ADMIN_PASSWORD` = `<Strong password with 12+ characters>`
   - Click **Deploy**.

3. **Seed Production Database**:
   From your local development machine, temporarily point `MONGODB_URI` in `.env` to your Atlas URI, then run:
   ```bash
   npm run seed
   ```
   This seeds the admin and sample students directly into your production Atlas database.

---

## Troubleshooting & FAQs

### 1. `connect ECONNREFUSED 127.0.0.1:27017`
- **Cause**: MongoDB is not running on your local machine.
- **Fix**: Start the MongoDB service.
  - Linux (systemd): `sudo systemctl start mongod`
  - macOS (Homebrew): `brew services start mongodb/brew/mongodb-community`
  - Or use a free cloud database URI from [MongoDB Atlas](https://www.mongodb.com/atlas) in your `.env`.

### 2. `JWT_SECRET must contain at least 32 characters`
- **Cause**: The `JWT_SECRET` in `.env` is too short or missing.
- **Fix**: Open `.env` and set `JWT_SECRET` to a random string with 32 or more characters.

### 3. `Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters) in .env`
- **Cause**: Admin password set in `.env` has fewer than 12 characters.
- **Fix**: Ensure `ADMIN_PASSWORD` in `.env` is at least 12 characters long before running `npm run seed:admin`.

### 4. `EADDRINUSE: address already in use :::5000`
- **Cause**: Another process is already running on port 5000.
- **Fix**: Change `PORT=5001` in `.env` and update `CLIENT_ORIGIN=http://localhost:5001`, or terminate the process using port 5000 (`lsof -i :5000` / `kill <PID>`).

---

## Deployment (Vercel + MongoDB Atlas)

1. **MongoDB Atlas**:
   - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
   - Create a database user and configure Network Access (`0.0.0.0/0` for cloud serverless access).
   - Copy the connection string (e.g. `mongodb+srv://<user>:<password>@cluster.mongodb.net/students?retryWrites=true&w=majority`).

2. **Deploy to Vercel**:
   - Push your code to GitHub (**do not commit your `.env` file**).
   - Import the repository in your Vercel Dashboard.
   - Under **Project Settings → Environment Variables**, add:
     - `NODE_ENV` = `production`
     - `MONGODB_URI` = `<Your MongoDB Atlas URI>`
     - `JWT_SECRET` = `<Random 32+ character secret>`
     - `JWT_EXPIRES_IN` = `1d`
     - `CLIENT_ORIGIN` = `https://your-project.vercel.app`
     - `ADMIN_NAME` = `Project Administrator`
     - `ADMIN_EMAIL` = `admin@example.com`
     - `ADMIN_PASSWORD` = `<Strong password with 12+ characters>`
   - Click **Deploy**.

3. **Seed Production Database**:
   From your local development machine, temporarily point `MONGODB_URI` in `.env` to your Atlas URI, then run:
   ```bash
   npm run seed
   ```
   This seeds the admin and sample students directly into your production Atlas database.

