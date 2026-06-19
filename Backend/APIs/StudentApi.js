import exp from 'express';
import {StudentModel} from '../models/StudentModel.js';
import {config} from 'dotenv';
import {verifyToken} from '../middlewares/VerifyToken.js';
import {upload} from '../config/multer.js';
import { DriveModel } from '../models/DriveModel.js';
import { ApplicationModel } from '../models/ApplicationModel.js';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';

config();
export const studentApp=exp.Router();

const getResumeBucket = () => new GridFSBucket(mongoose.connection.db, { bucketName: "resumes" });

const uploadResumeToGridFS = (file, userId) => {
    return new Promise((resolve, reject) => {
        const fileName = `resume_${userId}_${Date.now()}.pdf`;
        const uploadStream = getResumeBucket().openUploadStream(fileName, {
            contentType: file.mimetype,
            metadata: { userId }
        });

        uploadStream.on("error", reject);
        uploadStream.on("finish", () => resolve(uploadStream.id));
        uploadStream.end(file.buffer);
    });
};

// create or update student profile
studentApp.post("/profile",verifyToken("STUDENT"),upload.single("resume"),async(req,res,next)=>{
    try{
        const userId=req.user.id;
        const studentData={ ...req.body };
        
        // Handle resume file upload
        if(req.file){
            const resumeFileId = await uploadResumeToGridFS(req.file, userId);
            studentData.resumeFileId = resumeFileId;
            studentData.resumeURL = `/api/student/resume/${resumeFileId}`;
        }
        
        // Parse skills from string / JSON if necessary
        if (studentData.skills) {
            if (typeof studentData.skills === 'string') {
                try {
                    studentData.skills = JSON.parse(studentData.skills);
                } catch (e) {
                    studentData.skills = studentData.skills.split(',').map(s => s.trim()).filter(Boolean);
                }
            }
        }
        
        // Parse education array from string / JSON if necessary
        if (studentData.education) {
            if (typeof studentData.education === 'string') {
                try {
                    studentData.education = JSON.parse(studentData.education);
                } catch (e) {
                    console.error("Failed parsing education field:", e);
                    studentData.education = [];
                }
            }
        }

        let student=await StudentModel.findOne({userId});
        if(student){
            student=await StudentModel.findOneAndUpdate({userId},studentData,{new:true});
            return res.status(200).json({
                message:"Student profile updated successfully",
                payload:student
            });
        }   
        
        studentData.userId=userId;
        student=await StudentModel.create(studentData);
        await student.save();
        
        res.status(201).json({
            message:"Student profile created successfully",
            payload:student
        });
    }
    catch(err){
        next(err);
    }
});

// stream resume PDF from MongoDB GridFS
studentApp.get("/resume/:fileId", verifyToken(), async(req,res,next)=>{
    try{
        const { fileId } = req.params;

        if (!ObjectId.isValid(fileId)) {
            return res.status(400).json({ message: "Invalid resume file id" });
        }

        const resumeFileId = new ObjectId(fileId);
        const student = await StudentModel.findOne({ resumeFileId });

        if(!student){
            return res.status(404).json({ message: "Resume not found. Please upload the resume again." });
        }

        const isOwner = student.userId.toString() === req.user.id;
        let isAuthorizedCompany = false;

        if(req.user.role === "COMPANY"){
            const companyDrives = await DriveModel.find({ userId: req.user.id }).select("_id");
            const companyDriveIds = companyDrives.map((drive) => drive._id);
            const companyApplication = await ApplicationModel.findOne({
                userId: student.userId,
                driveId: { $in: companyDriveIds }
            });
            isAuthorizedCompany = !!companyApplication;
        }

        if(!isOwner && !isAuthorizedCompany){
            return res.status(403).json({ message: "You are not authorized to view this resume" });
        }

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline; filename=resume.pdf"
        });

        const downloadStream = getResumeBucket().openDownloadStream(resumeFileId);
        downloadStream.on("error", () => {
            if(!res.headersSent){
                res.status(404).json({ message: "Resume file not found. Please upload it again." });
            } else {
                res.end();
            }
        });
        downloadStream.pipe(res);
    }
    catch(err){
        next(err);
    }
});
// get student profile
studentApp.get("/profile",verifyToken("STUDENT"),async(req,res,next)=>{
    try{
        const userId=req.user.id;
        const student=await StudentModel.findOne({userId});
        if(!student){
            // Return empty profile representation instead of crashing / 404 to let frontend load defaults
            return res.status(200).json({
                message:"Student profile not found, returning default",
                payload: {
                    userId,
                    education: [],
                    skills: [],
                    experience: "",
                    projects: "",
                    resumeURL: "",
                    linkedInLink: "",
                    gitHubLink: ""
                }
            });
        }
        res.status(200).json({
            message:"Student profile retrieved successfully",
            payload:student
        });
    }
    catch(err){
        next(err);
    }
});
