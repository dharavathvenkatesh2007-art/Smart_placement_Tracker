import { Schema, model, Types } from 'mongoose';

const ScheduleSchema = new Schema({
    applicationId: {
        type: Types.ObjectId,
        ref: "Application",
        required: [true, "Application ID is required"]
    },
    driveId: {
        type: Types.ObjectId,
        ref: "Drive",
        required: [true, "Drive ID is required"]
    },
    studentId: {
        type: Types.ObjectId,
        ref: "User",
        required: [true, "Student User ID is required"]
    },
    companyId: {
        type: Types.ObjectId,
        ref: "User",
        required: [true, "Company User ID is required"]
    },
    roundType: {
        type: String,
        enum: ["Resume Shortlist", "Aptitude Round", "Coding Round", "Interview"],
        required: [true, "Round type is required"]
    },
    status: {
        type: String,
        enum: ["PENDING", "SHORTLISTED", "REJECTED", "PASSED", "FAILED", "SCHEDULED"],
        default: "SCHEDULED"
    },
    date: {
        type: Date,
        default: null
    },
    time: {
        type: String,
        default: ""
    },
    details: {
        type: String,
        default: ""
    },
    feedback: {
        type: String,
        default: ""
    }
}, {
    timestamps: true,
    versionKey: false,
    strict: true
});

export const ScheduleModel = model("Schedule", ScheduleSchema);
