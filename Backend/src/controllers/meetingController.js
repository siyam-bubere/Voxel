import { Meeting } from "../models/meetingModel.js";

/**
 * Creates a new meeting room in the database (purely alphabetic strings)
 * Route: POST /api/v1/meetings/create
 * Access: Protected
 */
export const createMeeting = async (req, res) => {
    try {
        // 1. Generate a unique, structured meeting code using letters only (e.g., abc-def-ghi)
        const generateCode = () => {
            // CRITICAL FIX: Removed '0123456789' from the available character set
            const chars = "abcdefghijklmnopqrstuvwxyz";
            const part = () => Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
            return `${part()}-${part()}-${part()}`;
        };

        const uniqueMeetingCode = generateCode();

        // 2. Instantiate and map fields using the EXACT Mongoose schema key names
        const newMeeting = new Meeting({
            meetingCode: uniqueMeetingCode, 
            user_id: req.user?.id,         // Populated via decoded JWT token middleware
            isActive: true,
            createdAt: new Date()
        });

        // 3. Save to MongoDB
        await newMeeting.save();

        // 4. Return success response exactly matching what LandingPage.jsx expects
        return res.status(200).json({
            success: true,
            meetingCode: uniqueMeetingCode,
            message: "Room initialized successfully."
        });

    } catch (error) {
        console.error("Error creating meeting:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error. Failed to create room."
        });
    }
};

/**
 * Verifies if a given meeting code exists and is active
 * Route: GET /api/v1/meetings/verify/:meetingCode
 * Access: Protected
 */
export const verifyMeeting = async (req, res) => {
    try {
        const { meetingCode } = req.params;

        if (!meetingCode) {
            return res.status(400).json({ 
                success: false, 
                exists: false, 
                message: "Meeting code parameter is required." 
            });
        }

        // Look up the meeting document matching your unique layout structure
        const meeting = await Meeting.findOne({ meetingCode: meetingCode });

        if (!meeting) {
            return res.status(200).json({ 
                success: true, 
                exists: false, 
                message: "This meeting code does not exist." 
            });
        }

        if (!meeting.isActive) {
            return res.status(200).json({
                success: true,
                exists: false,
                message: "This meeting room has concluded or is inactive."
            });
        }

        return res.status(200).json({
            success: true,
            exists: true,
            message: "Meeting room verified successfully."
        });

    } catch (error) {
        console.error("Error verifying meeting:", error);
        return res.status(500).json({
            success: false,
            exists: false,
            message: "Internal database verification failure."
        });
    }
};