import mongoose from "mongoose";
import dotenv from "dotenv";
import Internship from "./models/Internship.js";
import User from "./models/user.js";

dotenv.config();

async function transferData(email) {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log("❌ User not found");
            process.exit();
        }
        
        console.log(`📡 Transferring all system internships to User: ${user.email} (${user._id})`);
        
        const result = await Internship.updateMany({}, { $set: { employerId: user._id } });
        console.log(`✅ Updated ${result.modifiedCount} internships.`);
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

transferData("viji26@gmail.com");
