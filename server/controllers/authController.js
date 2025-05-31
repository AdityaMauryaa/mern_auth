import jwt from 'jsonwebtoken'
import bcrypt, { hash } from 'bcryptjs'
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import 'dotenv/config'
import { EMAIL_VERIFY_TEMPLATE,PASSWORD_RESET_TEMPLATE } from '../config/emailTemplate.js';
export const register=async (req,res)=>{
    const {name,email,password}=req.body;
    if(!name || !email || !password){
        return res.json({success:false,message:'Missing Details'})
    }
    try {
        const existingUser=await userModel.findOne({email});
        if(existingUser){
            return res.json({success:false,message:"User already exist"});
        }
        const hashPassword=await bcrypt.hash(password,10);
        const user = new  userModel({
            name,
            email,
            password:hashPassword
        })
        await user.save();

        const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'});
        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV==='production',
            sameSite:process.env.NODE_ENV==='production'?'none':'strict',
            maxAge: 7*24*60*60*1000
        })

        const mailOptions={
            from:process.env.SENDER_EMAIL,
            to:email,
            subject:'Welcome to webpage',
            text:`Welcome to webpage.Your account has been created with email id:${email}`         
        }
        await transporter.sendMail(mailOptions);
        return res.json({success:true,message:"Successfully registered "})


    } catch (error) {
      return   res.json({success:false,message:"Registration error occured "+error.message})
    }
}

export const login=async (req,res)=>{
 const {email,password}=req.body;
 if(!email || !password){
    return res.json({success:false,
        message:'email and password are required'
    })
 }
 try {
    const user=await userModel.findOne({email});
    if(!user){
        return res.json({success:false,message:'Invalid email'});
    }
    const isMatch=await bcrypt.compare(password,user.password)
    if(!isMatch){
        return res.json({success:false, message:'Invalid password'});
    }
    
    const token=jwt.sign({id:user._id},
        process.env.JWT_SECRET,
        {expiresIn:'7d'}
    );
    res.cookie('token',token,{
        httpOnly:true,
        secure:process.env.NODE_ENV==='production',
        sameSite:process.env.NODE_ENV==='production'?'none':'strict',
        maxAge: 7*24*60*60*1000
    })

    return res.json({success:true,message:"Successfully logged in"})

 } catch (error) {
    return res.json({success:false,message:"Login error occured "+error.message})
 }
}

export const logout=async (req,res)=>{
    try{
        res.clearCookie('token',{
            httpOnly:true,
            secure:process.env.NODE_ENV==='production',
            sameSite:process.env.NODE_ENV==='production'?'none':'strict',
        })
        return res.json({success:true,message:"Successfully Logged out"})
    }
    catch(error){
        return res.json({success:false,message:'Logout error occured'})
    }
}

export const sendVerifyOtp= async (req,res)=>{
    try{
        const userId = req.user?.id;
        const user=await userModel.findById(userId);
        if(user.isAccountVerified){
            return res.json({success:false,message:"Account already verified"});
        }
        const otp=String(Math.floor(100000+Math.random()*900000));
        user.verifyOtp=otp;
        user.verifyOtpExpireAt=Date.now()+24*60*60*1000;
        await user.save();
        const mailOption={
            from:process.env.SENDER_EMAIL,
            to:user.email,
            subject:'User Verifcation Otp',
            html:EMAIL_VERIFY_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
        }
       await transporter.sendMail(mailOption);
       res.json({success:true,message:"verification OTP sent on email and valid for next 24hrs"})
    }catch(error){
        res.json({success:false,message:"sendVerifyOtp "+error.message});
    }
}

export const verifyEmail= async(req,res)=>{
    const { otp } = req.body;
    const userId = req.user.id; 
    if(!userId || !otp){
        return res.json({success:false,message:"Missing Details"})
    }
    try {
        const user=await userModel.findById(userId);
        if(!user){
            return res.json({success:false,message:"User Not Found"})

        }
        if(user.verifyOtp==='' || user.verifyOtp!=otp){
            return res.json({success:false,message:"Invalid OTP"})
        }
        if(user.verifyOtpExpireAt<Date.now()){
            return res.json({success:false,message:'OTP EXpired'})
        }
        user.isAccountVerified=true;
        user.verifyOtp="";
        user.verifyOtpExpireAt=0;
        await user.save()
        return res.json({success:true,message:"Email Verified Successfully"})
    } catch (error) {
        return res.json({success:false,message:error.message});
    }
}


export const isAuthenticated=async (req,res)=>{
    try {
        return res.json({success:true,message:'User Authenticated'})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}


export const sendResetOtp=async (req,res)=>{
    const {email}=req.body;
    if(!email){
        return res.json({success:false,message:"Email is required"})
    }
    try {
        const user=await userModel.findOne({email})
        if(!user){
            return res.json({success:false,message:"User Not Found"})
        }

        const otp=String(Math.floor(100000+Math.random()*900000));
        user.resetOtp=otp;
        user.resetOtpExpireAt=Date.now()+24*60*60*1000;
        await user.save();

        const mailOption={
            from:process.env.SENDER_EMAIL,
            to:user.email,
            subject:'User Verifcation Otp',
           

            html:PASSWORD_RESET_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
        }
       await transporter.sendMail(mailOption);
       return res.json({success:true,message:"OTP sent successfully"})



    } catch (error) {
        return res.json({success:false,message:error.message})
    }
}

export const resetPassword=async (req,res)=>{
    const {email,otp,newPassword}=req.body;
    if(!email || !otp || !newPassword){
        return res.json({success:false,message:"email,otp and password are required"})
    }
    try {
        const user= await userModel.findOne({email})
        if(!user){
            return res.json({success:false,message:"User not found"})
        }
        if(user.resetOtp==="" || user.resetOtp!==otp){
            return res.json({false:false,message:"Invalid OTP"})
        }
        if(user.resetOtpExpireAt<Date.now()){
            return res.json({false:false,message:"OTP has expired"})
        }
        const hashedPassword=await bcrypt.hash(newPassword,10)
        user.password=hashedPassword;
        user.resetOtp="";
        user.resetOtpExpireAt=0;
        await user.save();
        return res.json({success:true,message:"Password changed successfully"})

    } catch (error) {
        return res.json({success:false,message:error.message})
    }
}