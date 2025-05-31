import jwt from 'jsonwebtoken'

const userAuth=async (req,res,next)=>{
    const {token}=req.cookies;
    if(!token){
        return res.json({success:false,message:"USer not authorized, Login Again"})
    }
    try {
     const tokenDecode=jwt.verify(token,process.env.JWT_SECRET);
     if(tokenDecode.id){
        req.user={id: tokenDecode.id};
     }else{
        return res.json({success:false,message:"USer not authorized, Login Again"})
     }
     next();

    } catch (error) {
        res.json({success:false ,message:"userAuth "+error.message})
    }
}

export default userAuth;