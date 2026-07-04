import dotenv from 'dotenv'; 
dotenv.config(); // Must be first to resolve the "secretOrPrivateKey must have a value" error

import express from 'express';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import cors from 'cors';
import connectToSocket from './controllers/socketManager.js';
import userRoutes from "./routes/userRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";

const app = express();
const server = createServer(app);

// --- DYNAMIC CORS POLICY MATRIX ---
// Explicitly handles dynamic tunnels (.ngrok-free.dev / .ngrok-free.app) securely without breaking WebSocket handshake protocols
const trustedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000"
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const isLocalhost = origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1");
        const isNgrokTunnel = origin.endsWith(".ngrok-free.dev") || origin.endsWith(".ngrok-free.app");
        
        if (isLocalhost || isNgrokTunnel || trustedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS unauthorized domain vector intercepted"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
})); 

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// ROUTE REGISTRATIONS
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/meetings", meetingRoutes); 

const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8000));

app.get("/", (req, res) => {
    return res.json({ "hello": "world" });
});

const start = async () => {
    try {
        const dbConnection = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`DB connected, HOST: ${dbConnection.connection.host}`);
        
        const port = app.get("port");
        server.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });
    } catch (error) {
        console.error("Error starting the server:", error);
        process.exit(1); 
    }
}

start();