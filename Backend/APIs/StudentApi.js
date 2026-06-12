import exp from 'express';
import {StudentModel} from '../models/StudentModel.js';
import {config} from 'dotenv';
import {verifyToken} from '../middlewares/VerifyToken.js';
import {upload} from '../config/multer.js';
import { DriveModel } from '../models/DriveModel.js';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

config();
export const studentApp=exp.Router();



// create or update student profile
studentApp.post("/profile",verifyToken("STUDENT"),upload.single("resume"),async(req,res,next)=>{
    try{
        const userId=req.user.id;
        const studentData={ ...req.body };
        
        // Handle resume file upload
        if(req.file){
           const uploadDir = path.resolve("uploads", "resumes");
            await mkdir(uploadDir, { recursive: true });

            const fileName = `resume_${userId}_${Date.now()}.pdf`;
            const filePath = path.join(uploadDir, fileName);
            await writeFile(filePath, req.file.buffer);

            studentData.resumeURL = `${req.protocol}://${req.get("host")}/uploads/resumes/${fileName}`;
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
