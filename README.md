 Smart Placement Tracker

A full-stack MERN application designed to streamline college placement activities by helping Training & Placement Offices (TPOs) manage recruitment drives, track student progress, and automate communication throughout the hiring process.

📌 Project Overview

Smart Placement Tracker provides a centralized platform for:

Managing placement drives and companies.
Filtering eligible students based on criteria.
Tracking interview rounds and placement status.
Sending automated notifications and emails.
Providing dashboards for different users.

The system reduces manual work and improves transparency in campus recruitment.

✨ Features
👨‍🎓 Student Features
Student registration and login.
View active placement drives.
Apply for eligible drives.
Track interview progress.
Receive placement notifications.
Manage profile information.
🏢 TPO/Admin Features
Secure authentication.
Create and manage recruitment drives.
Manage company information.
Filter eligible students using criteria such as:
CGPA
Branch
Passing Year
Update round status.
Track selections.
Send automated emails.
📧 Notification Features
Drive announcements.
Round progression updates.
Selection notifications.
Status change alerts.
🛠 Tech Stack
Frontend
React.js
JavaScript
React Router
Axios
CSS/Tailwind (based on implementation)
Vite
Backend
Node.js
Express.js
MongoDB
Mongoose
JWT Authentication
Nodemailer
Multer
🏗 System Architecture
Frontend (React)
        ↓
Axios API Calls
        ↓
Express Server
        ↓
Authentication Middleware
        ↓
Controllers / APIs
        ↓
MongoDB Database
        ↓
Email Notification Services
📂 Project Structure
Smart_Placement_Tracker
│
├── Backend
│   ├── APIs
│   ├── config
│   ├── middlewares
│   ├── models
│   ├── uploads
│   └── utils
│
└── Frontend
    ├── public
    ├── src
    └── dist
🔧 Backend Documentation
APIs Folder

Contains route handlers responsible for business logic.

Responsibilities include:

Authentication
Student management
Company operations
Placement drive handling
Status updates
Notifications
Models Folder

Stores Mongoose schemas.

Typical models include:

User Model

Stores authentication data.

Fields:

{
    name,
    email,
    password,
    role
}

Purpose:

Authentication
Authorization
Student Model

Stores student information.

Fields:

{
    studentId,
    branch,
    cgpa,
    passingYear,
    skills,
    resume
}

Purpose:

Eligibility filtering
Profile management
Company Model

Stores recruiter information.

Fields:

{
    companyName,
    description,
    package,
    eligibilityCriteria
}

Purpose:

Drive creation
Company listings
Drive Model

Represents placement drives.

Fields:

{
    companyId,
    driveDate,
    rounds,
    eligibleBranches,
    minimumCGPA
}

Purpose:

Recruitment lifecycle management
Notification Model

Stores alerts sent to users.

Fields:

{
    recipient,
    message,
    status,
    createdAt
}

Purpose:

Notification history.
🔐 Authentication Flow
Login/Register
      ↓
Validate Credentials
      ↓
Generate JWT Token
      ↓
Store Token
      ↓
Protected Routes
      ↓
Role-Based Access
🛡 Middleware
Authentication Middleware

Responsible for:

Verifying JWT.
Protecting APIs.
Identifying users.
Authorization Middleware

Ensures only authorized roles can access resources.

Examples:

Admin-only routes.
Student-specific operations.
Error Handling Middleware

Handles:

Validation errors.
Authentication failures.
Server exceptions.
⚛ Frontend Documentation
src Folder

Contains application source code.

Typical structure:

src
├── components
├── pages
├── services
├── hooks
├── utils
├── assets
└── App.jsx
Components

Reusable UI elements.

Examples:

Navbar

Provides navigation links.

Sidebar

Dashboard navigation.

Cards

Used for:

Companies
Drives
Statistics
Tables

Display:

Student lists
Applications
Round results
Forms

Used in:

Login
Registration
Drive creation
📄 Pages
Login Page

Allows users to authenticate.

Dashboard

Displays:

Statistics
Active drives
Recent updates
Companies Page

Features:

Company listings.
Details.
Drives Page

Features:

Active recruitment drives.
Eligibility information.
Profile Page

Students can:

Update profiles.
Upload resumes.
Notifications Page

Shows:

Alerts.
Selection updates.
🔄 State Management

The frontend manages:

Authentication state.
User information.
Drive data.
Notifications.

Data flow:

Component
    ↓
API Service
    ↓
Backend
    ↓
Response
    ↓
Update UI
🔌 API Documentation
Authentication
Register
POST /api/auth/register

Registers new users.

Login
POST /api/auth/login

Returns JWT token.

Students
Get Students
GET /api/students

Returns all students.

Update Student
PUT /api/students/:id

Updates student details.

Companies
Create Company
POST /api/companies

Adds recruiter information.

Get Companies
GET /api/companies

Returns company listings.

Drives
Create Drive
POST /api/drives

Creates placement drives.

Get Drives
GET /api/drives

Returns active drives.

Update Round Status
PUT /api/drives/:id/status

Updates interview progression.

📧 Email Notification Workflow
Create Drive
     ↓
Find Eligible Students
     ↓
Generate Notifications
     ↓
Send Emails
     ↓
Update Delivery Status
🗄 Database Relationships
User
 └── Student Profile

Company
 └── Drives
      └── Applications
           └── Notifications
🚀 Installation
Backend
cd Backend
npm install
npm start
Frontend
cd Frontend
npm install
npm run dev
⚙ Environment Variables

Backend:

PORT=
MONGO_URI=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASS=
CLIENT_URL=

Frontend:

VITE_API_URL=
📸 Screenshots

Add screenshots inside:

Frontend/public/screenshots/

Example:

![Dashboard](screenshots/dashboard.png)

![Drives](screenshots/drives.png)

![Students](screenshots/students.png)
🔮 Future Enhancements
Resume Parsing
AI-based Eligibility Suggestions
Real-time Notifications
Interview Scheduling
Placement Analytics Dashboard
Mobile Application Support
Export Reports to PDF/Excel
👨‍💻 Author

Dharavath Venkatesh

GitHub: https://github.com/dharavathvenkatesh2007-art
Deployment:https://smart-placement-tracker-orcin.vercel.app

⭐ Conclusion

Smart Placement Tracker simplifies campus recruitment by digitizing placement workflows, improving communication between TPOs and students, and enabling efficient tracking of the entire hiring process through a modern MERN-based architecture.
