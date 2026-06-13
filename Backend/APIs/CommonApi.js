//import
import exp from "express";
import {UserModel} from "../models/UserModel.js";
import {hash,compare} from "bcryptjs";
import jwt from "jsonwebtoken";
import {verifyToken} from "../middlewares/VerifyToken.js";
import {config} from "dotenv";
import {upload} from "../config/multer.js"
import {uploadToCloudinary} from "../config/cloudnaryUpload.js";
import { sendWelcomeEmail } from "../utils/emailer.js";

config();   
export const commonApp = exp.Router();
const {sign} = jwt;

// Helper function to normalize role
const normalizeRole = (role) => {
  if (role === 'student' || role === 'STUDENT') return 'STUDENT';
  if (role === 'company' || role === 'COMPANY') return 'COMPANY';
  return role?.toUpperCase();
};

//register
commonApp.post("/register", (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single("profileImage")(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  } else {
    next();
  }
}, async(req,res,next)=>{
    try{
        const newUser = req.body;
        const normalizedRole = normalizeRole(newUser.role);
        newUser.role = normalizedRole;
        newUser.password = await hash(newUser.password, 10);
        
        if (normalizedRole === "STUDENT") {
            if (!newUser.name) {
                return res.status(400).json({message:"Name is required for student role"});
            }
            const nameParts = newUser.name.trim().split(/\s+/);
            newUser.firstName = nameParts[0];
            newUser.lastName = nameParts.slice(1).join(" ") || "Student";
        }
        else if (normalizedRole === "COMPANY") {
            if (!newUser.companyName && newUser.name) {
                newUser.companyName = newUser.name;
            }
            if (!newUser.companyName && newUser.company) {
                newUser.companyName = newUser.company;
            }
            if (!newUser.companyName) {
                return res.status(400).json({message:"Company name is required for company role"});
            }
        }
        
        // Handle file upload
        if(req.file){
            const result = await uploadToCloudinary(req.file.buffer);
            newUser.profileImageURL = result.secure_url;
        }
        
        const user = await UserModel.create(newUser);
        await user.save();
        
        const token = sign(
            {id: user._id, email: user.email, role: user.role},
            process.env.SECRET_KEY,
            {expiresIn: "7d"}
        );

        const name = (user.role === "STUDENT" || user.role === "ADMIN") ? `${user.firstName} ${user.lastName}`.trim() : user.companyName;
        
        res.status(201).json({
            message: "User registered successfully",
            token: token,
            user: {
                _id: user._id,
                name: name,
                email: user.email,
                phone: user.phone,
                company: user.companyName,
                college: user.college,
                role: user.role,
                profileImageURL: user.profileImageURL,
                location: user.location,
                bio: user.bio,
                website: user.website,
                companyType: user.companyType,
                hrLinkedInLink: user.hrLinkedInLink
            },
            role: normalizedRole.toLowerCase()
        });

        sendWelcomeEmail(user).catch(err => console.error("Error sending welcome email:", err));
    }catch(err){
        next(err);
    }
});

//login
commonApp.post("/login", async(req,res)=>{
    try{
        const {email, password} = req.body;
        const user = await UserModel.findOne({email});
        
        if(!user || !(await compare(password, user.password))){
            return res.status(401).json({message:"Invalid email or password"});
        }

        if(!user.isUserActive){
            return res.status(403).json({message:"User account is deactivated or blocked"});
        }   
        
        const token = sign(
            {id: user._id, email: user.email, role: user.role},
            process.env.SECRET_KEY,
            {expiresIn: "7d"}
        );
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        });
        
        const name = (user.role === "STUDENT" || user.role === "ADMIN") ? `${user.firstName} ${user.lastName}`.trim() : user.companyName;

        res.status(200).json({
            message: "Login successful",
            token: token,
            user: {
                _id: user._id,
                name: name,
                email: user.email,
                phone: user.phone,
                company: user.companyName,
                college: user.college,
                role: user.role,
                profileImageURL: user.profileImageURL,
                location: user.location,
                bio: user.bio,
                website: user.website,
                companyType: user.companyType,
                hrLinkedInLink: user.hrLinkedInLink
            },
            role: user.role.toLowerCase()
        });
    }catch(err){
        res.status(500).json({message:"Error occurred during login", error: err.message});
    }
});

// Get current user
commonApp.get("/me", verifyToken(), async(req,res,next)=>{
    try{
        const user = await UserModel.findById(req.user.id);
        
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        
        const name = (user.role === "STUDENT" || user.role === "ADMIN") ? `${user.firstName} ${user.lastName}`.trim() : user.companyName;

        res.status(200).json({
            message: "User retrieved successfully",
            user: {
                _id: user._id,
                name: name,
                email: user.email,
                phone: user.phone,
                company: user.companyName,
                college: user.college,
                role: user.role,
                profileImageURL: user.profileImageURL,
                location: user.location,
                bio: user.bio,
                website: user.website,
                companyType: user.companyType,
                hrLinkedInLink: user.hrLinkedInLink
            }
        });
    }catch(err){
        next(err);
    }
});

// Update user profile
commonApp.put("/profile", verifyToken(), (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single("profileImage")(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  } else {
    next();
  }
}, async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const updateData = req.body;
        
        // Split name on update if provided
        if ((req.user.role === "STUDENT" || req.user.role === "ADMIN") && updateData.name) {
            const nameParts = updateData.name.trim().split(/\s+/);
            updateData.firstName = nameParts[0];
            updateData.lastName = nameParts.slice(1).join(" ") || "Admin";
        } else if (req.user.role === "COMPANY" && updateData.name) {
            updateData.companyName = updateData.name;
        }

        // Handle file upload
        if(req.file){
            const result = await uploadToCloudinary(req.file.buffer);
            updateData.profileImageURL = result.secure_url;
        }
        
        const user = await UserModel.findByIdAndUpdate(userId, updateData, {new: true});
        
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        
        const name = (user.role === "STUDENT" || user.role === "ADMIN") ? `${user.firstName} ${user.lastName}`.trim() : user.companyName;

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                name: name,
                email: user.email,
                phone: user.phone,
                company: user.companyName,
                college: user.college,
                role: user.role,
                profileImageURL: user.profileImageURL,
                location: user.location,
                bio: user.bio,
                website: user.website,
                companyType: user.companyType,
                hrLinkedInLink: user.hrLinkedInLink
            }
        });
    }catch(err){
        next(err);
    }
});

// Change password
commonApp.put("/change-password", verifyToken(), async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current password and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters long" });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Compare current password
        const isMatch = await compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect current password" });
        }

        // Hash and update new password
        user.password = await hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (err) {
        next(err);
    }
});

//logout
commonApp.post("/logout", (req,res)=>{
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ message: "Please login" });
    }
    res.clearCookie("token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    });
    res.status(200).json({message: "Logout successful"});
});
