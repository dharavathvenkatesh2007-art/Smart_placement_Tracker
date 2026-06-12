import exp from 'express';
import {DriveModel} from '../models/DriveModel.js';
import {config} from 'dotenv';
import {verifyToken} from '../middlewares/VerifyToken.js';
import { UserModel } from '../models/UserModel.js';
import { ApplicationModel } from '../models/ApplicationModel.js';
import { NotificationModel } from '../models/NotificationModel.js';
import { sendNewDriveEmail } from '../utils/emailer.js';

config();
export const driveApp = exp.Router();

// Create drive
driveApp.post("/create", verifyToken("COMPANY"), async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const driveData = req.body;
        
        if (!driveData || Object.keys(driveData).length === 0) {
            return res.status(400).json({ message: "Request body is required" });
        }

        const companyUser = await UserModel.findById(userId);
        if (!companyUser) {
            return res.status(404).json({ message: "Company user not found" });
        }

        driveData.userId = userId;
        if (!driveData.companyName) {
            driveData.companyName = companyUser.companyName || "Company";
        }
        
        // Parse input arrays if they are strings
        if (!driveData.requirements) driveData.requirements = [];
        if (!driveData.selectionProcess) driveData.selectionProcess = [];
        
        if (typeof driveData.requirements === 'string') {
            driveData.requirements = driveData.requirements.split(',').map(r => r.trim()).filter(Boolean);
        }
        if (typeof driveData.selectionProcess === 'string') {
            driveData.selectionProcess = driveData.selectionProcess.split(',').map(s => s.trim()).filter(Boolean);
        }

        const driveDoc = await DriveModel.create(driveData);
        await driveDoc.save();
        
        // Notify all active students
        const students = await UserModel.find({ role: 'STUDENT', isUserActive: true });
        
        if (students.length > 0) {
            // 1. Create DB Notification records
            const notificationRecords = students.map(student => ({
                userId: student._id,
                title: `New Drive: ${driveDoc.companyName}`,
                message: `A new placement drive for ${driveDoc.position} has been posted. CTC: ₹${driveDoc.ctc} LPA.`,
                type: 'drive'
            }));
            await NotificationModel.insertMany(notificationRecords).catch(err => console.error("Error creating notifications:", err));

            // 2. Dispatch emails
            const studentEmails = students.map(s => s.email).filter(Boolean);
            sendNewDriveEmail(studentEmails, driveDoc).catch(err => console.error("Error sending new drive emails:", err));
        }

        res.status(201).json({ 
            message: "Drive created successfully",
            drive: driveDoc
        });
    }
    catch(err){
        next(err);
    }       
});

// Get all drives
driveApp.get("/get", verifyToken("COMPANY"), async(req,res,next)=>{   
    try{
        const drives = await DriveModel.find();
        res.status(200).json({
            message: "Drives retrieved successfully",
            drives: drives
        });
    }
    catch(err){
        next(err);
    }
});

// Get active drives (for students and general users)
driveApp.get("/active-drives", verifyToken(), async(req,res,next)=>{   
    try{
        const { filter } = req.query;
        let query = { status: { $in: ['ACTIVE', 'OPEN'] } };
        
        // Apply filters
        if (filter === 'recent') {
            query = { ...query, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
        } else if (filter === 'highestctc') {
            // Will be sorted by CTC in descending order
        } else if (filter === 'lowestdeadline') {
            // Will be sorted by deadline in ascending order
        }
        
        let drives = await DriveModel.find(query).populate('userId', 'companyName name email phone location bio website companyType hrLinkedInLink profileImageURL');
        
        // Apply sorting
        if (filter === 'highestctc') {
            drives.sort((a, b) => (b.ctc || 0) - (a.ctc || 0));
        } else if (filter === 'lowestdeadline') {
            drives.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        }
        
        res.status(200).json({
            message: "Active drives retrieved successfully",
            drives: drives || []
        });
    }
    catch(err){
        next(err);
    }
});

// Get company's drives
driveApp.get("/my-drives", verifyToken("COMPANY"), async(req,res,next)=>{   
    try{
        const userId = req.user.id;
        const drives = await DriveModel.find({ userId });
        
        res.status(200).json({
            message: "Your drives retrieved successfully",
            drives: drives || []
        });
    }
    catch(err){
        next(err);
    }
});

// Get drive details
driveApp.get("/:driveId", verifyToken(), async(req,res,next)=>{   
    try{
        const { driveId } = req.params;
        const userId = req.user.id;
        
        const drive = await DriveModel.findById(driveId).populate('userId', 'companyName name email phone location bio website companyType hrLinkedInLink profileImageURL');
        
        if (!drive) {
            return res.status(404).json({ message: "Drive not found" });
        }
        
        // Check if user has already applied
        const hasApplied = await ApplicationModel.findOne({ userId, driveId });
        
        res.status(200).json({
            message: "Drive details retrieved successfully",
            drive: drive,
            hasApplied: !!hasApplied
        });
    }
    catch(err){
        next(err);
    }
});

// Update drive
driveApp.put("/:driveId", verifyToken("COMPANY"), async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const { driveId } = req.params;
        const updateData = req.body;
        
        const drive = await DriveModel.findById(driveId);
        if (!drive) {
            return res.status(404).json({ message: "Drive not found" });
        }
        
        if (drive.userId.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to update this drive" });
        }
        
        const updatedDrive = await DriveModel.findByIdAndUpdate(driveId, updateData, { new: true });
        
        res.status(200).json({
            message: "Drive updated successfully",
            drive: updatedDrive
        });
    }
    catch(err){
        next(err);
    }
});

// Delete drive
driveApp.delete("/:driveId", verifyToken("COMPANY"), async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const { driveId } = req.params;
        
        const drive = await DriveModel.findById(driveId);
        if (!drive) {
            return res.status(404).json({ message: "Drive not found" });
        }
        
        if (drive.userId.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to delete this drive" });
        }
        
        await DriveModel.findByIdAndDelete(driveId);
        
        res.status(200).json({ message: "Drive deleted successfully" });
    }
    catch(err){
        next(err);
    }
});
