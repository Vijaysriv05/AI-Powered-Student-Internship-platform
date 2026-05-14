import mongoose from "mongoose";
import dotenv from "dotenv";
import Internship from "./models/Internship.js";
import User from "./models/user.js";

dotenv.config();

async function checkInternships(email) {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log("❌ User not found");
            process.exit();
        }
        
        console.log(`🔍 User: ${user.email} (ID: ${user._id})`);
        
        const internships = await Internship.find({ employerId: user._id });
        console.log(`📊 Found ${internships.length} internships for this User ID.`);
        
        if (internships.length === 0) {
            console.log("⚠️ No internships found for this User ID.");
            // Check if internships are linked to a different ID or Employer record
            const allCount = await Internship.countDocuments();
            console.log(`🌎 Total internships in system: ${allCount}`);
            
            if (allCount > 0) {
                const some = await Internship.findOne();
                console.log(`💡 Example internship employerId type: ${typeof some.employerId} value: ${some.employerId}`);
            }
        } else {
            internships.forEach(i => console.log(`   - ${i.title} (${i._id})`));
        }
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkInternships("viji26@gmail.com");
