import exp from 'express';
import { NotificationModel } from '../models/NotificationModel.js';
import { verifyToken } from '../middlewares/VerifyToken.js';
import { config } from 'dotenv';

config();
export const notificationApp = exp.Router();

// Get user's notifications
notificationApp.get("/my-notifications", verifyToken(), async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const notifications = await NotificationModel.find({ userId })
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            message: "Notifications retrieved successfully",
            notifications: notifications || []
        });
    }
    catch(err){
        next(err);
    }
});

// Mark notification as read
notificationApp.put("/:notificationId/read", verifyToken(), async(req,res,next)=>{
    try{
        const { notificationId } = req.params;
        const userId = req.user.id;
        
        const notification = await NotificationModel.findById(notificationId);
        if(!notification){
            return res.status(404).json({message: "Notification not found"});
        }
        
        if(notification.userId.toString() !== userId){
            return res.status(403).json({message: "You are not authorized to update this notification"});
        }
        
        notification.read = true;
        await notification.save();
        
        res.status(200).json({
            message: "Notification marked as read",
            notification: notification
        });
    }
    catch(err){
        next(err);
    }
});

// Delete notification
notificationApp.delete("/:notificationId", verifyToken(), async(req,res,next)=>{
    try{
        const { notificationId } = req.params;
        const userId = req.user.id;
        
        const notification = await NotificationModel.findById(notificationId);
        if(!notification){
            return res.status(404).json({message: "Notification not found"});
        }
        
        if(notification.userId.toString() !== userId){
            return res.status(403).json({message: "You are not authorized to delete this notification"});
        }
        
        await NotificationModel.findByIdAndDelete(notificationId);
        
        res.status(200).json({ message: "Notification deleted successfully" });
    }
    catch(err){
        next(err);
    }
});

// Create notification (internal use)
notificationApp.post("/", async(req,res,next)=>{
    try{
        const { userId, type, message, relatedId } = req.body;
        
        if (!userId || !message) {
            return res.status(400).json({message: "userId and message are required"});
        }
        
        const notification = await NotificationModel.create({
            userId,
            title: req.body.title || 'Notification',
            type: type || 'general',
            message,
            relatedId,
            read: false
        });
        
        res.status(201).json({
            message: "Notification created successfully",
            notification: notification
        });
    }
    catch(err){
        next(err);
    }
});

// Delete all notifications for user
notificationApp.delete("/", verifyToken(), async(req,res,next)=>{
    try{
        const userId = req.user.id;
        
        await NotificationModel.deleteMany({ userId });
        
        res.status(200).json({ message: "All notifications deleted successfully" });
    }
    catch(err){
        next(err);
    }
});
