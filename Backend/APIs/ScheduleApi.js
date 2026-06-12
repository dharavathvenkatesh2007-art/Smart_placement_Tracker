import exp from 'express';
import { ScheduleModel } from '../models/ScheduleModel.js';
import { ApplicationModel } from '../models/ApplicationModel.js';
import { DriveModel } from '../models/DriveModel.js';
import { UserModel } from '../models/UserModel.js';
import { StudentModel } from '../models/StudentModel.js';
import { NotificationModel } from '../models/NotificationModel.js';
import { verifyToken } from '../middlewares/VerifyToken.js';
import { config } from 'dotenv';
import {
  sendScheduleNotificationEmail,
  sendScheduleUpdateEmail
} from '../utils/emailer.js';

config();
export const scheduleApp = exp.Router();

// Helper to format schedule for frontend
const formatSchedule = (sch) => {
  const drive = sch.driveId || {};
  const student = sch.studentId || {};
  const company = sch.companyId || {};
  const app = sch.applicationId || {};
  const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name || 'Student';
  const companyName = company.companyName || company.name || drive.companyName || 'Company';

  // Get resume URL from the populated application's studentId (StudentModel)
  const resumeURL = app.studentId?.resumeURL || app.resumeURL || '';

  return {
    _id: sch._id,
    applicationId: app._id || sch.applicationId,
    driveId: drive._id || sch.driveId,
    companyName: companyName,
    position: drive.position || 'N/A',
    studentName: studentName,
    studentEmail: student.email || '',
    studentPhone: student.phone || '',
    roundType: sch.roundType,
    status: sch.status,
    date: sch.date,
    time: sch.time || '',
    details: sch.details || '',
    feedback: sch.feedback || '',
    resumeURL: resumeURL,
    createdAt: sch.createdAt
  };
};

// Create a schedule (Company only)
scheduleApp.post("/create", verifyToken("COMPANY"), async (req, res, next) => {
  try {
    const companyUserId = req.user.id;
    const { applicationId, roundType, date, time, details, status } = req.body;

    const isResumeShortlist = roundType === 'Resume Shortlist';

    // For Resume Shortlist, date/time are not needed
    if (!applicationId || !roundType) {
      return res.status(400).json({ message: "applicationId and roundType are required" });
    }
    if (!isResumeShortlist && (!date || !time)) {
      return res.status(400).json({ message: "date and time are required for this round type" });
    }

    const application = await ApplicationModel.findById(applicationId).populate('driveId');
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const driveUserId = application.driveId.userId?._id || application.driveId.userId;
    if (driveUserId.toString() !== companyUserId) {
      return res.status(403).json({ message: "You are not authorized to schedule rounds for this application" });
    }

    // Check if schedule for this round already exists for the application
    const existingSchedule = await ScheduleModel.findOne({ applicationId, roundType });
    if (existingSchedule) {
      return res.status(400).json({ message: `A schedule for ${roundType} already exists for this application` });
    }

    const schedule = await ScheduleModel.create({
      applicationId,
      driveId: application.driveId._id,
      studentId: application.userId,
      companyId: companyUserId,
      roundType,
      date: isResumeShortlist ? new Date() : new Date(date),
      time: isResumeShortlist ? 'N/A' : time,
      details: details || '',
      status: status || (isResumeShortlist ? 'PENDING' : 'SCHEDULED')
    });

    // Populate for formatting and notifications
    await schedule.populate({ path: 'applicationId', populate: { path: 'studentId' } });
    await schedule.populate('studentId');
    await schedule.populate('companyId');
    await schedule.populate('driveId');

    const companyName = schedule.companyId.companyName || schedule.companyId.name || schedule.driveId.companyName || 'Company';

    // 1. Create DB Notification for Student
    const notifMessage = isResumeShortlist
      ? `Your resume is under review by ${companyName} for the ${schedule.driveId.position || ''} role.`
      : `Your ${roundType} has been scheduled by ${companyName} on ${new Date(date).toLocaleDateString()} at ${time}.`;

    await NotificationModel.create({
      userId: schedule.studentId._id,
      title: `New Schedule: ${roundType}`,
      message: notifMessage,
      type: 'interview'
    }).catch(err => console.error("Error creating student schedule notification:", err));

    // 2. Dispatch email to Student
    const studentUser = await UserModel.findById(schedule.studentId._id);
    if (studentUser) {
      sendScheduleNotificationEmail(studentUser, schedule.driveId, schedule)
        .catch(err => console.error("Error sending schedule notification email:", err));
    }

    res.status(201).json({
      message: "Schedule created successfully",
      schedule: formatSchedule(schedule)
    });
  } catch (err) {
    next(err);
  }
});

// Get user's schedules (both Student and Company)
scheduleApp.get("/my-schedules", verifyToken(), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query = {};
    if (role === 'STUDENT') {
      query.studentId = userId;
    } else if (role === 'COMPANY') {
      query.companyId = userId;
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    const schedules = await ScheduleModel.find(query)
      .populate({ path: 'applicationId', populate: { path: 'studentId' } })
      .populate('driveId')
      .populate('studentId')
      .populate('companyId')
      .sort({ date: -1, createdAt: -1 });

    const formattedSchedules = schedules.map(formatSchedule);

    res.status(200).json({
      message: "Schedules retrieved successfully",
      schedules: formattedSchedules
    });
  } catch (err) {
    next(err);
  }
});

// Update schedule status and feedback (Company only)
scheduleApp.put("/:scheduleId", verifyToken("COMPANY"), async (req, res, next) => {
  try {
    const companyUserId = req.user.id;
    const { scheduleId } = req.params;
    const { status, feedback, date, time, details, roundType } = req.body;

    const schedule = await ScheduleModel.findById(scheduleId)
      .populate('studentId')
      .populate('companyId')
      .populate('driveId');

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (schedule.companyId._id.toString() !== companyUserId) {
      return res.status(403).json({ message: "You are not authorized to update this schedule" });
    }

    if (status) schedule.status = status.toUpperCase();
    if (feedback !== undefined) schedule.feedback = feedback;
    if (date) schedule.date = new Date(date);
    if (time) schedule.time = time;
    if (details !== undefined) schedule.details = details;
    if (roundType) schedule.roundType = roundType;

    await schedule.save();

    const companyName = schedule.companyId.companyName || schedule.companyId.name || schedule.driveId.companyName || 'Company';

    // 1. Create DB Notification for Student
    await NotificationModel.create({
      userId: schedule.studentId._id,
      title: `Schedule Updated: ${schedule.roundType}`,
      message: `Your schedule status for ${schedule.roundType} with ${companyName} has been updated to ${schedule.status}.`,
      type: 'interview'
    }).catch(err => console.error("Error creating student schedule update notification:", err));

    // 2. Dispatch email to Student
    const studentUser = await UserModel.findById(schedule.studentId._id);
    if (studentUser) {
      sendScheduleUpdateEmail(studentUser, schedule.driveId, schedule)
        .catch(err => console.error("Error sending schedule update email:", err));
    }

    res.status(200).json({
      message: "Schedule updated successfully",
      schedule: formatSchedule(schedule)
    });
  } catch (err) {
    next(err);
  }
});

// Delete/Cancel a schedule (Company only)
scheduleApp.delete("/:scheduleId", verifyToken("COMPANY"), async (req, res, next) => {
  try {
    const companyUserId = req.user.id;
    const { scheduleId } = req.params;

    const schedule = await ScheduleModel.findById(scheduleId)
      .populate('studentId')
      .populate('companyId')
      .populate('driveId');

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (schedule.companyId._id.toString() !== companyUserId) {
      return res.status(403).json({ message: "You are not authorized to delete this schedule" });
    }

    await ScheduleModel.findByIdAndDelete(scheduleId);

    const companyName = schedule.companyId.companyName || schedule.companyId.name || schedule.driveId.companyName || 'Company';

    // Create DB Notification for Student
    await NotificationModel.create({
      userId: schedule.studentId._id,
      title: `Schedule Cancelled: ${schedule.roundType}`,
      message: `Your scheduled ${schedule.roundType} with ${companyName} has been cancelled.`,
      type: 'interview'
    }).catch(err => console.error("Error creating student schedule cancellation notification:", err));

    res.status(200).json({ message: "Schedule cancelled successfully" });
  } catch (err) {
    next(err);
  }
});
