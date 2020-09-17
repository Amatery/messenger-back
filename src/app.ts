import express from 'express'
import http from 'http'
import socketio from 'socket.io'

const app = express();
const server = http.createServer(app);
const socket = socketio(server);

app.get('/', (req, res) => {
    res.send('Hello, it\'s WS server')
})
const messages: Array<any> = []

const usersState = new Map();

socket.on('connection', (socketChannel) => {
    usersState.set(socketChannel, {id: new Date().getTime().toString(), name: 'anonym'} );

    socket.on('disconnect', () => {
        usersState.delete(socketChannel);
    });

    socketChannel.on('client-name-sent', (name: string) => {
        if (typeof name !== 'string') {
            return
        }
        const user = usersState.get(socketChannel);
        user.name = name;
    });

    socketChannel.on('client-typed', () => {
        socketChannel.broadcast.emit('user-typing', usersState.get(socketChannel))
    });

    socketChannel.on('client-message-sent', (message: string, successFn) => {
        if (typeof message !== 'string' || message.length > 20) {
            successFn("Message length should be less than 20 chars");
            return;
        }

        const user = usersState.get(socketChannel);

        let messageItem = {
            message: message, id: new Date().getTime(),
            user: {id: user.id, name: user.name}
        }
        messages.push(messageItem);

        socket.emit('new-message-sent', messageItem);

        successFn(null);
    })

    socketChannel.emit('init-messages-published', messages, (data: string) => {
        console.log("INIT MESSAGES RECEIVED: " + data )
    })

    console.log('a user connected')
})


const PORT = process.env.PORT || 3009

server.listen(PORT, () => {
    console.log('listening on *:3009')
});
