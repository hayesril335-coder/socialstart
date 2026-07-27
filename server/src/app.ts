import cors from 'cors'
import express from 'express'
export const app=express()
app.use(cors({origin:process.env.CLIENT_URL||'http://localhost:5173',credentials:true}))
app.use(express.json())
app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'SocialStart API'}))
app.use('/api',(req,res)=>res.status(501).json({message:`${req.method} ${req.path} is ready for its service implementation`}))
