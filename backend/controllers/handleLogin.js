import jwt from 'jsonwebtoken'
import Users from '../models/user.js'


const handleLogin = async(req, res)=>{
    try {
        const {email, password} = req.body;
        
        const check = await Users.findOne({email : email});
        
        if(!check) return res.json({message: 'User not registered'});
        
        
        if(check.password !== password) return res.json({message: 'Invalid Credentials'});
        
        const token = jwt.sign({user_id: check._id}, process.env.JWT, {expiresIn:'2D'});
        const cookieName = process.env.COOKIE_NAME || "token";
        
        res.cookie(cookieName, token ,{
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        });
        return res.json({message: 'Successfully LoggedIn'});
    } catch (error) {
        console.log("Error in handleLogin Function");
        return res.json({message: 'Error at backend'});  
    }
}

export default handleLogin;
