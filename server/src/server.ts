import 'dotenv/config'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { app } from './app.js'
const server=createServer(app)
const io=new Server(server,{cors:{origin:process.env.CLIENT_URL||'http://localhost:5173'}})
io.on('connection',socket=>{socket.on('conversation:join',(id:string)=>socket.join(`conversation:${id}`));socket.on('typing',payload=>socket.to(`conversation:${payload.conversationId}`).emit('typing',payload))})
const port=Number(process.env.PORT||4000)
server.listen(port,()=>console.log(`SocialStart API listening on ${port}`))
