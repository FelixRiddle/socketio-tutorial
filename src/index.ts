import express from "express";
import { createServer } from "node:http";
import { join } from "node:path";

// This one is not working for me I don't know why
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

export const CWD = process.cwd();
console.log(`Dirname: `, CWD);

app.get('/', (req, res) => {
    return res.sendFile(join(CWD, "index.html"));
});

io.on('connection', (socket) => {
    console.log(`A user connected`);
});

const PORT = 37000;
server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
