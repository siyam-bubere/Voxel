import { User } from "../models/userModel.js";
import httpStatus from "http-status";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and Password are required" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (isPasswordCorrect) {
            // Signs a valid cryptographic three-part JWT token with a local fallback backup string
            const token = jwt.sign(
                { id: user._id, username: user.username },
                process.env.JWT_SECRET || 'voxel_temporary_local_secret_fallback_key_123',
                { expiresIn: '24h' }
            );

            return res.status(httpStatus.OK).json({ token: token });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid credentials" });
        }

    } catch (err) {
        console.error("Login Controller Error: ", err);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong` });
    }
}

const register = async (req, res) => {
    const { email, username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(httpStatus.FOUND).json({ message: "User with this username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email: email,
            username: username,
            password: hashedPassword
        });

        await newUser.save();

        return res.status(httpStatus.CREATED).json({ message: "User registered successfully." });
    } catch (err) {
        console.error("Register Controller Error: ", err);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong` });
    }
};

export { login, register };