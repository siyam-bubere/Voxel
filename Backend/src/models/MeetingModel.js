import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", 
            required: true 
        },

        meetingCode: {
            type: String, 
            required: true,
            unique: true, 
            trim: true,   
            lowercase: true, 
            // FIXED: Updated regex to allow ONLY alphabets (removed 0-9) to match your new controller
            match: /^[a-z]{3}-[a-z]{3}-[a-z]{3}$/ 
        },

        // FIXED: Added missing isActive field so your verification controller can read it
        isActive: {
            type: Boolean,
            default: true,
            required: true
        },

        date: {
            type: Date,
            default: Date.now,
            required: true
        }
    }
);

// TTL Index: Automatically drops the document out of MongoDB exactly 24 hours after creation
meetingSchema.index({ date: 1 }, { expireAfterSeconds: 86400 });

const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };