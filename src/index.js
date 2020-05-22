const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser,removeUser,getUser,getUsersInRoom } = require('./utils/users')
//const { generateLocationMessage } = require('./utils/messages')//this is get specific files by there names
const app = express()
const server = http.createServer(app)
const io = socketio(server)
//console.log(io)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
//console.log(publicDirectoryPath)// equal to ==> C:\Users\shantanu shukla\Desktop\NODE2\chat-app\public

app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {//important to connection
    console.log('New WebSocket Connection')
    
    socket.on('join', (options, callback) => {
        const {error,user} = addUser({ id: socket.id, ...options })

        if(error){
           return callback(error) 
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin','Welcome!')) 
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room:user.room,
            users:getUsersInRoom(user.room)
        })

        callback()
    
    })

    socket.on('sendMessage', (message,callback) => {//message can be called anything only the eventname matter
 
    const filter = new Filter()
    
    if(filter.isProfane(message)){
        return callback('Profanity is not allowed!')
    }

       const user = getUser(socket.id)

    //    if(error){
    //     return callback(error) 
    //  }


       io.to(user.room).emit('message', generateMessage(user.username, message))
       callback()
    })


    socket.on('sendLocation', (coords,callback) => {//this is a listener

             const user = getUser(socket.id)
        
            io.to(user.room).emit('locationmessage', generateLocationMessage(user.username ,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
            callback('Location Shared')
    }) 


    socket.on('disconnect', () => {//the event here used is a inbuilt event
        const user = removeUser(socket.id)
       
        if(user)
        {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room:user.room,
            users: getUsersInRoom(user.room)
            })
        }
    })
})




server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})