import express from "express";
import { createServer } from "node:http";
import { join } from "node:path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

// This one is not working for me I don't know why
import { Server } from "socket.io";

export const CWD = process.cwd();

const app = express();
const server = createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {},
});

(async () => {
    // Connect to sqlite and create messages table
    const db = await open({
        filename: "chat.db",
        driver: sqlite3.Database,
    });
    
    // Create messages table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_offset TEXT UNIQUE,
            content TEXT
        )
    `);
    
    app.get('/', (req, res) => {
        return res.sendFile(join(CWD, "index.html"));
    });
    
    // Listen for connections
    io.on('connection', async (socket) => {
        console.log(`A user connected`);
        
        socket.on("disconnect", () => {
            console.log(`User disconnected`);
        });
        
        socket.on("chat message", async (msg, clientOffset, callback) => {
            let result;
            try {
                // Store messages in the database
                result = await db.run(`INSERT INTO messages (content, client_offset) VALUES (?, ?)`, msg, clientOffset);
            } catch(err: any) {
                console.error(err);
                if(err.errno === 19) {
                    // The message was already inserted so we notify the client
                    callback();
                } else {
                    // Nothing to do, just let the client retry
                }
                return;
            }
            
            io.emit("chat message", msg, result.lastID);
            
            // Acknowledge the callback
            callback();
        });
        
        if(!socket.recovered) {
            try {
                await db.each(
                    "SELECT id, content FROM messages WHERE id > ?",
                    [socket.handshake.auth.serverOffset || 0],
                    (_err, row) => {
                        socket.emit("chat message", row.content, row.id);
                    }
                )
            } catch(err: any) {
                console.error(err);
            }
        }
        
        socket.broadcast.emit("hi");
    });
    
    io.emit("hello", "world");
    
    // Start server
    const PORT = 37000;
    server.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
    });
})();
