import exp from 'express';
import {connect} from 'mongoose';
import {config} from 'dotenv';
import {commonApp} from './APIs/CommonApi.js';
import {studentApp} from './APIs/StudentApi.js';
import {driveApp} from './APIs/DriveApi.js';
import { applicationApp } from './APIs/ApplicationApi.js';
import { notificationApp } from './APIs/NotificationApi.js';
import { scheduleApp } from './APIs/ScheduleApi.js';
import { aiApp } from './APIs/AiApi.js';
import { adminApp } from './APIs/AdminApi.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

config();
const app=exp();

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(exp.json());
app.use(exp.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', exp.static(path.resolve('uploads')));

// API Routes - Updated to match frontend expectations
app.use("/api/user", commonApp);
app.use("/api/student", studentApp);
app.use("/api/drive", driveApp);
app.use("/api/application", applicationApp);
app.use("/api/notification", notificationApp);
app.use("/api/schedule", scheduleApp);
app.use("/api/ai", aiApp);
app.use("/api/admin", adminApp);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

async function connectDB(){
    try{
        await connect(process.env.DB_URL);
        console.log("DB connected successfully");
        
        // Seed admin user inline asynchronously
        import('./models/UserModel.js').then(async ({ UserModel }) => {
            const adminEmail = "admin@tracker.com";
            const existingAdmin = await UserModel.findOne({ email: adminEmail });
            if (!existingAdmin) {
                import('bcryptjs').then(async ({ hash }) => {
                    const hashedPassword = await hash("admin123", 10);
                    await UserModel.create({
                        firstName: "System",
                        lastName: "Admin",
                        email: adminEmail,
                        password: hashedPassword,
                        role: "ADMIN",
                        isUserActive: true
                    });
                    console.log("Admin user seeded successfully: admin@tracker.com");
                });
            }
        }).catch(err => console.error("Error seeding admin:", err));

        app.listen(process.env.PORT || 5000, () => console.log(`Server is running at port ${process.env.PORT || 5000}`));
    }
    catch(err){
        console.log("Error connecting to DB:", err);
        process.exit(1);
    }
}

connectDB();

// Invalid path handler
app.use((req, res, next) => {
  console.log("Invalid path:", req.url);
  res.status(404).json({ message: `Path ${req.url} is invalid` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.log("Error name:", err.name);
  console.log("Error code:", err.code);
  console.log("Full error:", err);

  const errCode = err.code ?? err.cause?.code ?? err.errorResponse?.code;
  const keyValue = err.keyValue ?? err.cause?.keyValue ?? err.errorResponse?.keyValue;

  if (errCode === 11000 && keyValue) {
    const field = Object.keys(keyValue)[0];
    const value = keyValue[field];

    return res.status(409).json({
      message: "error occurred",
      error: `${field} "${value}" already exists`
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Validation error", error: err.message });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format", error: err.message });
  }

  res.status(500).json({ message: "Internal server error", error: err.message });
});
