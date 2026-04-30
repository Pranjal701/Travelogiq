import Users from "../models/user.js";
import jwt from "jsonwebtoken"


const handleSignUP = async (req, res) => {
    try {
        const {name, email, password} = req.body;
        
        const check = await Users.findOne({email: email});
        
        if(check) return res.json({message: "User already exist"});
        
        const user_details = await Users.create({
            email: email,
            name: name,
            password: password,
        })
        

        const user_id = user_details._id;
        
        const token = jwt.sign({user_id: user_id}, process.env.JWT, {expiresIn: '2D'});
        const cookieName = process.env.COOKIE_NAME || "token";
        
        res.cookie(cookieName, token ,{
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        });
        return res.status(200).json({message: "User Created Successfully"});
    } catch (error) {
        console.log("Error in handleSignUP function")
        return res.json({message: 'Error at backend'});
    }
}


export default handleSignUP;
