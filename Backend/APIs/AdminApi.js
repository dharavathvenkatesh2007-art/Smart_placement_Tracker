import exp from 'express';
import { UserModel } from '../models/UserModel.js';
import { StudentModel } from '../models/StudentModel.js';
import { DriveModel } from '../models/DriveModel.js';
import { ApplicationModel } from '../models/ApplicationModel.js';
import { NotificationModel } from '../models/NotificationModel.js';
import { verifyToken } from '../middlewares/VerifyToken.js';

export const adminApp = exp.Router();

// Get admin panel analytics dashboard stats
adminApp.get("/analytics", verifyToken("ADMIN"), async (req, res, next) => {
    try {
        const [
            totalStudents,
            totalCompanies,
            totalDrives,
            totalApplications,
            selectedApps,
            hiredApps,
            pendingApps,
            appliedApps,
            shortlistedApps,
            rejectedApps,
            activeDrives,
            openDrives,
            closedDrives,
            blockedDrives
        ] = await Promise.all([
            UserModel.countDocuments({ role: "STUDENT" }),
            UserModel.countDocuments({ role: "COMPANY" }),
            DriveModel.countDocuments(),
            ApplicationModel.countDocuments(),
            ApplicationModel.countDocuments({ status: "SELECTED" }),
            ApplicationModel.countDocuments({ status: "HIRED" }),
            ApplicationModel.countDocuments({ status: "PENDING" }),
            ApplicationModel.countDocuments({ status: "APPLIED" }),
            ApplicationModel.countDocuments({ status: "SHORTLISTED" }),
            ApplicationModel.countDocuments({ status: "REJECTED" }),
            DriveModel.countDocuments({ status: "ACTIVE" }),
            DriveModel.countDocuments({ status: "OPEN" }),
            DriveModel.countDocuments({ status: "CLOSED" }),
            DriveModel.countDocuments({ status: "BLOCKED" })
        ]);

        const totalSelected = selectedApps + hiredApps;
        const successRate = totalApplications > 0 ? Math.round((totalSelected / totalApplications) * 100) : 0;

        const drives = await DriveModel.find();
        const totalCTC = drives.reduce((acc, d) => acc + (d.ctc || 0), 0);
        const avgCTC = drives.length > 0 ? (totalCTC / drives.length).toFixed(1) : 0;
        const highestCTC = drives.length > 0 ? Math.max(...drives.map(d => d.ctc || 0)) : 0;

        res.status(200).json({
            totalStudents,
            totalCompanies,
            totalDrives,
            totalApplications,
            successRate,
            avgCTC,
            highestCTC,
            applicationsByStatus: {
                PENDING: pendingApps + appliedApps,
                SHORTLISTED: shortlistedApps,
                SELECTED: selectedApps,
                REJECTED: rejectedApps,
                HIRED: hiredApps
            },
            drivesByStatus: {
                ACTIVE: activeDrives + openDrives,
                CLOSED: closedDrives,
                BLOCKED: blockedDrives
            },
            selectedCount: totalSelected
        });
    } catch (err) {
        next(err);
    }
});

// Get all students along with their profile details
adminApp.get("/students", verifyToken("ADMIN"), async (req, res, next) => {
    try {
        const users = await UserModel.find({ role: "STUDENT" }).select("-password");
        const studentProfiles = await StudentModel.find();

        const studentsList = users.map(user => {
            const profile = studentProfiles.find(p => p.userId.toString() === user._id.toString()) || {};
            return {
                _id: user._id,
                name: `${user.firstName} ${user.lastName}`.trim(),
                email: user.email,
                phone: user.phone || "N/A",
                college: user.college || "N/A",
                location: user.location || "N/A",
                isUserActive: user.isUserActive,
                profileImageURL: user.profileImageURL,
                skills: profile.skills || [],
                education: profile.education || [],
                experience: profile.experience || "",
                projects: profile.projects || "",
                resumeURL: profile.resumeURL || "",
                linkedInLink: profile.linkedInLink || "",
                gitHubLink: profile.gitHubLink || ""
            };
        });

        res.status(200).json({ students: studentsList });
    } catch (err) {
        next(err);
    }
});

// Get all company accounts
adminApp.get("/companies", verifyToken("ADMIN"), async (req, res, next) => {
    try {
        const companies = await UserModel.find({ role: "COMPANY" }).select("-password");
        res.status(200).json({ companies });
    } catch (err) {
        next(err);
    }
});

// Get all placement drives
adminApp.get("/drives", verifyToken("ADMIN"), async (req, res, next) => {
    try {
        const drives = await DriveModel.find().populate("userId", "email phone location companyType website hrLinkedInLink profileImageURL");
        res.status(200).json({ drives });
    } catch (err) {
        next(err);
    }
});

// Block or approve user account
adminApp.put("/users/:userId/status", verifyToken("ADMIN"), async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { isUserActive } = req.body;

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.isUserActive = isUserActive;
        await user.save();

        res.status(200).json({ message: `User status updated successfully`, isUserActive: user.isUserActive });
    } catch (err) {
        next(err);
    }
});

// Block or toggle drive status
adminApp.put("/drives/:driveId/status", verifyToken("ADMIN"), async (req, res, next) => {
    try {
        const { driveId } = req.params;
        const { status } = req.body; // "ACTIVE" or "BLOCKED" or "CLOSED"

        const drive = await DriveModel.findById(driveId);
        if (!drive) {
            return res.status(404).json({ message: "Drive not found" });
        }

        drive.status = status;
        await drive.save();

        res.status(200).json({ message: `Drive status updated successfully`, status: drive.status });
    } catch (err) {
        next(err);
    }
});

// Broadcast announcement notifications to students, companies, or all users
adminApp.post("/broadcast-notification", verifyToken("ADMIN"), async (req, res, next) => {
    try {
        const { title, message, targetRole } = req.body;

        if (!message) {
            return res.status(400).json({ message: "Notification message is required" });
        }

        let query = { isUserActive: true };
        if (targetRole === "STUDENT" || targetRole === "COMPANY") {
            query.role = targetRole;
        } else {
            query.role = { $in: ["STUDENT", "COMPANY"] };
        }

        const users = await UserModel.find(query).select("_id");
        if (users.length === 0) {
            return res.status(200).json({ message: "No active users found to notify", notifiedCount: 0 });
        }

        const notifications = users.map(user => ({
            userId: user._id,
            title: title || "Admin Broadcast",
            message: message,
            type: "general"
        }));

        await NotificationModel.insertMany(notifications);

        res.status(200).json({ message: "Notifications broadcasted successfully", notifiedCount: users.length });
    } catch (err) {
        next(err);
    }
});
