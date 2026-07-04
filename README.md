# 🚀 Voxel - WebRTC Mesh Video Collaboration Platform

Voxel is a modern, responsive, full-stack real-time video conferencing application built on top of WebRTC mesh networks and high-throughput communication pipelines. The application utilizes a highly secure backend authentication layer coupled with automated room pruning engines to deliver temporary, scalable meeting instances.

---

## 🛠️ Tech Stack & Key Architectures

### Frontend Engine
* **React.js & Hooks:** Manages declarative interface modules, context state engines, and custom input sanitization routines.
* **Vanilla CSS (Modular Layers):** Embedded dark-mode high-tech aesthetic containing geometric viewports designed for absolute view scalability.

### Backend Infrastructure
* **Node.js & Express:** Custom RESTful API layers mapping room management sequences and protected operations.
* **Mongoose & MongoDB Atlas:** Stores account configurations and ephemeral meeting documents using time-bounded structural collections.
* **WebSockets / Socket.io:** Facilitates instant, real-time signaling data synchronization across peers.

---

## 🔥 Key Technical Implementation Features

* **Strict Alphabetic Code Space:** Custom room generators completely filter out numbers (`0-9`) and special glyphs to avoid URL encoding anomalies, generating predictable, sanitized structures like `abc-def-ghi`.
* **Zero-Leak Middleware Protection:** Restricts backend endpoint contexts via advanced JSON Web Token (JWT) checking. Implements fail-safe hardcoded cryptographic fallback signatures to maintain high application uptime during local `.env` cache misses.
* **Automated Data Pruning (TTL Indexes):** Real-time rooms are temporary by design. The database engine maps an active `expireAfterSeconds: 86400` rule to discard expired meeting configurations automatically exactly 24 hours after execution.
* **True Aspect Ratio View Scaling:** Screen share feeds are isolated from local webcams to override global mirroring rules (`scaleX(-1)`), utilizing elastic CSS constraints (`object-fit: contain`) to guarantee full-screen, uncropped text presentation.

---

## 📁 Repository Structure

```text
voxel/
├── Backend/
│   ├── src/
│   │   ├── controllers/      # Handles business logics (Auth, Meeting engines)
│   │   ├── middleware/       # Authentication pipeline shields (JWT Verification)
│   │   ├── models/           # Data layer architectures (Mongoose Schemas)
│   │   └── routes/           # Endpoint mappings
│   ├── .env.example          # Sample environment token blueprint
│   └── package.json          # Node system runtime configurations
└── Frontend/
    ├── src/
    │   ├── components/       # Interface screens (Landing, Auth, Legal, VideoRooms)
    │   └── App.jsx           # Client-side router distribution hub

    🚀 Environment Blueprint & Startup
1. Database and Secret Allocations
Create a .env file inside your server root path following this architecture:

Code snippet
PORT=8000
MONGODB_URI=your_mongodb_srv_connection_string
JWT_SECRET=secure_mesh_network_string_key_generation
2. Dependency Execution
Launch Backend Signaling Server:
Bash
cd Backend
npm install
npm run dev
Launch Frontend Client Interface:
Bash
cd Frontend
npm install
npm run dev
🛡️ Legal Modules
Voxel includes standard built-in legal compliance screens built natively into the frontend application layer matching the application design tokens:

Terms of Service (/terms): Declares room lifecycle patterns, strict access constraints, and acceptable platform handling paradigms.

Privacy Policy (/privacy): Informs users about standard bcrypt encryption schemes, user session management, and the automated 24-hour metadata deletion lifecycle.
