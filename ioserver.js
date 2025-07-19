import {readFileSync} from "node:fs";
import https from "https";
import http from "http";
import {Server} from "socket.io";
import cors from "cors";
import express from 'express';

const IOSERVERPORT = process.env.PORT || 3001;
const app = express();
let IOServer;
if(process.env.NODE_ENV === 'production') {
    const key = readFileSync('./localhost+2-key.pem');
    const cert = readFileSync('./localhost+2.pem');
    IOServer = https.createServer({ key, cert }, app);
}
else{
    IOServer = http.createServer(app);
}
const origin = `${process.env.NODE_ENV === 'production'?'https':'http'}://localhost:5173`;
const io = new Server(IOServer,{
    cors: {
        origin: origin,
        methods: 'GET,POST,PUT,DELETE,OPTIONS',
    }
});

app.use(cors({
    origin: origin,
}));

app.get('/', (req, res) => {
    res.send('Socket.IO server is running!');
});

io.on('connection', socket => {
    console.log('A user connected on socket id : ',socket.id);

    socket.on('video event', msg => {
        console.log(`Received video event from ${socket.id} with message : `, msg);
    });

    socket.on('join-room',(roomId)=>{
        socket.join(roomId);
        console.log(`${socket.id} joined room ${roomId}`);
        socket.to(roomId).emit('user-joined',{
            msg:`${socket.id} joined the party`,
            peerID:socket.id
        });
    });

    socket.on('signal',(data)=>{
        console.log(`Received signal from ${socket.id} : `,data);
        if(data.to){
            io.to(data.to).emit('signal',{
                ...data,
                from: socket.id,
            });
            console.log(`signal from socket id : ${socket.id} emitted to socket id ${data.to}`);
        }
        else{
            const room = Array.from(socket.rooms).find(r=>r !== socket.id);
            if(room){
                socket.to(room).emit('signal', {
                    ...data,
                    from: socket.id,
                });
                console.log(`signal from socket id : ${socket.id} emitted to room ${room}`);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected from socket id : ',socket.id);
        const room = Array.from(socket.rooms).find(r=>r !== socket.id);
        if(room){
            socket.to(room).emit('user-left',`${socket.id} has left the room`);
        }
    });

});


IOServer.listen(IOSERVERPORT, () => {
    console.log('IO Server listening on port ' + IOSERVERPORT);
})