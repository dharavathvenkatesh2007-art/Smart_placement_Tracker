import {Schema, model, Types} from 'mongoose';

const notificationSchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"]
    },
    title: {
        type: String,
        default: "Notification"
    },
    message: {
        type: String,
        required: [true, "Notification message is required"]
    },
    read: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        default: "general"
    }
}, {
    timestamps: true,
    versionKey: false
});

export const NotificationModel = model("Notification", notificationSchema);