import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            // Allows both localhost and your external ngrok instances dynamically
            origin: (origin, callback) => callback(null, true), 
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });
    
    io.on("connection", (socket) => {
        // Track the user's room directly on their socket instance to avoid massive loops later
        let userRoom = null;

        socket.on("join-call", (path) => {
            userRoom = path; // Save room assignment

            if(connections[path] === undefined) {
                connections[path] = [];
            }
            connections[path].push(socket.id);

            timeOnline[socket.id] = new Date();

            for(let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path]);
            }

            if(messages[path] !== undefined) {
                for(let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message", 
                        messages[path][a]['data'],
                        messages[path][a]['sender'], 
                        messages[path][a]['socket-id-sender']
                    );
                }
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            // Instead of searching all rooms via .reduce(), instantly use userRoom
            if(userRoom && connections[userRoom]) {
                if(messages[userRoom] === undefined) {
                    messages[userRoom] = [];
                }

                messages[userRoom].push({
                    'sender': sender, 
                    'data': data, 
                    'socket-id-sender': socket.id
                });
                
                console.log("message", userRoom, ":", sender, data);

                connections[userRoom].forEach(element => {
                    io.to(element).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        socket.on("disconnect", () => {
            if (timeOnline[socket.id]) {
                var diffTime = Math.abs(timeOnline[socket.id] - new Date());
                delete timeOnline[socket.id];
            }
            console.log(`User was online for ${diffTime}ms`);

            // Instantly look up the room using the stored variable
            const key = userRoom;

            if(key && connections[key]) {
                // 1. Inform everyone else in the room
                for(let a = 0; a < connections[key].length; ++a) {
                    if (connections[key][a] !== socket.id) {
                        io.to(connections[key][a]).emit('user-left', socket.id);
                    }
                }

                // 2. Remove the user safely without looping mutations
                var index = connections[key].indexOf(socket.id);
                if (index !== -1) {
                    connections[key].splice(index, 1);
                }

                // 3. Clean up empty room
                if(connections[key].length === 0) {
                    delete connections[key];
                    delete messages[key]; // Optional: cleans up text history too
                }
            }
        });
    });
};

export default connectToSocket;