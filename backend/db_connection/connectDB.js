import mongoose from "mongoose";

const connectDB = async () =>{
    try {
        const connection = await mongoose.connect(`${process.env.MONGODB}`)
        console.log("DB connected Successfully");
    } catch (error) {
        console.log("DB connection failed");
    }
}

export default connectDB;