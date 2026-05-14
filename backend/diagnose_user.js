import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.js";

dotenv.config();

async function checkUser(email) {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for diagnostics...");
        
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            console.log("✅ User Found!");
            console.log("   Name:", user.name || user.full_name);
            console.log("   Email:", user.email);
            console.log("   Role in DB:", user.role);
        } else {
            console.log("❌ User not found with email:", email);
            // Try case-insensitive search
            const users = await User.find({ email: { $regex: new RegExp("^" + email + "$", "i") } });
            if (users.length > 0) {
                console.log("⚠️ Found similar user(s) with different casing:");
                users.forEach(u => console.log(`   - ${u.email} (Role: ${u.role})`));
            }
        }
        process.exit();
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

const targetEmail = "viji28@gmail.com";
checkUser(targetEmail);
