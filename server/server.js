import express from 'express';
import mongoose from 'mongoose';
import  'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDb from './config/mongodb.js';
import authRouter from './routes/authRoutes.js'
import userRouter from './routes/userRoutes.js';
const app =express();
const PORT=process.env.PORT ||4000;
connectDb();
const allowedOrigins = [
  'http://localhost:5173',
  'https://mern-auth-five-roan.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.get('/',(req,res)=>res.send("Hi welcome to node"))
app.use('/api/auth',authRouter)
app.use('/api/user',userRouter)
app.listen(PORT);
