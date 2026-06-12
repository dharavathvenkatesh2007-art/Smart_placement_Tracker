import {ApplicationModel} from "../models/ApplicationModel.js";
import {DriveModel} from "../models/DriveModel.js";
import {UserModel} from "../models/UserModel.js";
import {NotificationModel} from "../models/NotificationModel.js";
import {StudentModel} from "../models/StudentModel.js";
import {config} from 'dotenv';
import {verifyToken} from '../middlewares/VerifyToken.js';
import exp from 'express';
import {
  sendApplicationConfirmationEmail,
  sendApplicationAlertToCompany,
  sendApplicationStatusUpdateEmail
} from "../utils/emailer.js";

config();
export const applicationApp = exp.Router();

// Helper to format application for frontend
const formatApplication = (app) => {
  const drive = app.driveId || {};
  const student = app.userId || {};
  const studentName = student.role === 'STUDENT' ? `${student.firstName} ${student.lastName}`.trim() : student.companyName || student.name;
  
  return {
    _id: app._id,
    status: app.status ? app.status.toLowerCase() : "pending",
    feedback: app.feedback || "",
    appliedOn: app.createdAt,
    driveId: drive._id,
    companyName: drive.companyName || "N/A",
    position: drive.position || "N/A",
    ctc: drive.ctc || 0,
    location: drive.location || "N/A",
    studentName: studentName || "N/A",
    studentEmail: student.email || "",
    studentPhone: student.phone || "",
    studentCollege: student.college || "",
    resumeURL: app.studentId?.resumeURL || "",
    companyDetails: {
      website: drive.userId?.website || "",
      companyType: drive.userId?.companyType || "",
      location: drive.userId?.location || drive.location || "",
      profileImageURL: drive.userId?.profileImageURL || "",
      bio: drive.userId?.bio || "",
      email: drive.userId?.email || "",
      phone: drive.userId?.phone || "",
      hrLinkedInLink: drive.userId?.hrLinkedInLink || ""
    },
    studentDetails: {
      skills: app.studentId?.skills || [],
      education: app.studentId?.education || [],
      experience: app.studentId?.experience || "",
      projects: app.studentId?.projects || "",
      linkedInLink: app.studentId?.linkedInLink || "",
      gitHubLink: app.studentId?.gitHubLink || "",
      profileImageURL: student.profileImageURL || ""
    }
  };
};

const formatApplicationWithProfile = async (app) => {
  if (!app.studentId && app.userId?._id) {
    const studentProfile = await StudentModel.findOne({ userId: app.userId._id });
    if (studentProfile) {
      app.studentId = studentProfile;
    }
  }

  return formatApplication(app);
};

// Apply for drive
applicationApp.post("/apply", verifyToken("STUDENT"), async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const { driveId } = req.body;
        
        if (!driveId) {
            return res.status(400).json({message: "Drive ID is required"});
        }
        
        const drive = await DriveModel.findById(driveId);
        if(!drive){
            return res.status(404).json({message: "Drive not found"});
        }
        
        const existingApplication = await ApplicationModel.findOne({userId, driveId});
        if(existingApplication){
            return res.status(400).json({message: "You have already applied for this drive"});
        }
        
        const studentProfile = await StudentModel.findOne({ userId });
        const application = await ApplicationModel.create({
            userId,
            driveId,
            status: "PENDING",
            studentId: studentProfile?._id
        });
        
        await application.populate({ path: 'driveId', populate: { path: 'userId' } });
        await application.populate('userId');
        await application.populate('studentId');
        
        // Add student ID to drive applicants list
        if (drive.applicants && !drive.applicants.includes(userId)) {
            drive.applicants.push(userId);
            await drive.save();
        }
        
        // 1. Create DB Notification for Student
        await NotificationModel.create({
            userId: userId,
            title: `Applied: ${drive.companyName}`,
            message: `Your application for the ${drive.position} position has been successfully submitted.`,
            type: 'application'
        }).catch(err => console.error("Error creating student application notification:", err));

        // 2. Create DB Notification for Company
        await NotificationModel.create({
            userId: drive.userId,
            title: `New Applicant: ${drive.position}`,
            message: `A new student has applied for the ${drive.position} position.`,
            type: 'application'
        }).catch(err => console.error("Error creating company application notification:", err));

        // 3. Send Emails asynchronously
        const studentUser = await UserModel.findById(userId);
        const companyUser = await UserModel.findById(drive.userId);
        
        if (studentUser) {
            sendApplicationConfirmationEmail(studentUser, drive)
              .catch(err => console.error("Error sending application confirmation email:", err));
            
            if (companyUser) {
                sendApplicationAlertToCompany(companyUser, studentUser, drive)
                  .catch(err => console.error("Error sending application alert to company:", err));
            }
        }
        
        res.status(201).json({
            message: "Applied for drive successfully",
            application: formatApplication(application)
        });
    }
    catch(err){
        next(err);
    } 
});

// Get student's applications
applicationApp.get("/my-applications", verifyToken("STUDENT"), async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const applications = await ApplicationModel.find({userId})
            .populate({ path: 'driveId', populate: { path: 'userId' } })
            .populate('userId')
            .populate('studentId');
        
        const formattedApplications = await Promise.all((applications || []).map(formatApplicationWithProfile));

        res.status(200).json({
            message: "Applications retrieved successfully",
            applications: formattedApplications
        });
    }
    catch(err){
        next(err);
    }
}); 

// Get applications with status filter
applicationApp.get("/list", verifyToken("STUDENT"), async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const { status } = req.query;
        
        let query = { userId };
        if (status && status !== 'all') {
            query.status = status.toUpperCase();
        }
        
        const applications = await ApplicationModel.find(query)
            .populate({ path: 'driveId', populate: { path: 'userId' } })
            .populate('userId')
            .populate('studentId');
        
        const formattedApplications = await Promise.all((applications || []).map(formatApplicationWithProfile));

        res.status(200).json({
            message: "Applications retrieved successfully",
            applications: formattedApplications
        });
    }
    catch(err){
        next(err);
    }
});

// Get company's drive applications
applicationApp.get("/drive-applications", verifyToken("COMPANY"), async(req,res,next)=>{
    try{
        const userId = req.user.id;
        
        // Get all drives belonging to this company
        const drives = await DriveModel.find({ userId });
        const driveIds = drives.map(d => d._id);
        
        // Get all applications for these drives
        const applications = await ApplicationModel.find({ driveId: { $in: driveIds } })
            .populate({ path: 'driveId', populate: { path: 'userId' } })
            .populate('userId')
            .populate('studentId');
        
        const formattedApplications = await Promise.all((applications || []).map(formatApplicationWithProfile));

        res.status(200).json({
            message: "Applications retrieved successfully",
            applications: formattedApplications
        });
    }
    catch(err){
        next(err);
    }
});

// Get applications for specific drive (company)
applicationApp.get("/:driveId", verifyToken("COMPANY"), async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const { driveId } = req.params;
        
        const drive = await DriveModel.findById(driveId);
        if(!drive){
            return res.status(404).json({message: "Drive not found"});
        }
        
        if(drive.userId.toString() !== userId){
            return res.status(403).json({message: "You are not authorized to view applications for this drive"});
        }
        
        const applications = await ApplicationModel.find({driveId})
            .populate('userId')
            .populate({ path: 'driveId', populate: { path: 'userId' } })
            .populate('studentId');
        
        const formattedApplications = await Promise.all((applications || []).map(formatApplicationWithProfile));

        res.status(200).json({
            message: "Applications retrieved successfully",
            applications: formattedApplications
        });
    }
    catch(err){
        next(err);
    }
});

// Update application status (for company)
applicationApp.put("/:applicationId/status", verifyToken("COMPANY"), async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const { applicationId } = req.params;
        const { status, feedback } = req.body;
        
        if (!status) {
            return res.status(400).json({message: "Status is required"});
        }

        const application = await ApplicationModel.findById(applicationId).populate({ path: 'driveId', populate: { path: 'userId' } });
        if(!application){
            return res.status(404).json({message: "Application not found"});
        }
        
        const driveOwnerId = (application.driveId.userId?._id || application.driveId.userId).toString();
        if(driveOwnerId !== userId){
            return res.status(403).json({message: "You are not authorized to update this application"});
        }   
        
        application.status = status.toUpperCase();
        if (feedback) {
            application.feedback = feedback;
        }
        await application.save();
        await application.populate('userId');
        await application.populate('studentId');
        
        // 1. Create DB Notification for Student
        await NotificationModel.create({
            userId: application.userId._id,
            title: `Application Status: ${application.driveId.companyName}`,
            message: `Your application status for the ${application.driveId.position} role has been updated to ${status.toUpperCase()}.`,
            type: 'status'
        }).catch(err => console.error("Error creating status update notification:", err));

        // 2. Dispatch email to Student
        const studentUser = await UserModel.findById(application.userId._id);
        if (studentUser) {
            sendApplicationStatusUpdateEmail(studentUser, application.driveId, status)
              .catch(err => console.error("Error sending status update email:", err));
        }
        
        const formattedApplication = await formatApplicationWithProfile(application);

        res.status(200).json({
            message: "Application status updated successfully",
            application: formattedApplication
        });
    }
    catch(err){
        next(err);
    }       
});

// Withdraw application (student)
applicationApp.delete("/:applicationId", verifyToken("STUDENT"), async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const { applicationId } = req.params;
        
        const application = await ApplicationModel.findById(applicationId);
        if(!application){
            return res.status(404).json({message: "Application not found"});
        }
        
        if(application.userId.toString() !== userId){
            return res.status(403).json({message: "You are not authorized to withdraw this application"});
        }
        
        // Remove student from drive applicants list
        const drive = await DriveModel.findById(application.driveId);
        if (drive && drive.applicants) {
            drive.applicants = drive.applicants.filter(id => id.toString() !== userId);
            await drive.save();
        }
        
        await ApplicationModel.findByIdAndDelete(applicationId);
        
        res.status(200).json({ message: "Application withdrawn successfully" });
    }
    catch(err){
        next(err);
    }
});
