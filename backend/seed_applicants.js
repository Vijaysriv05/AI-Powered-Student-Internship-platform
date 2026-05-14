import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.js";
import Application from "./models/Application.js";
import Internship from "./models/Internship.js";

dotenv.config();

async function seedApplicants() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // 1. Find a student or create one
        let student = await User.findOne({ role: "student" });
        if (!student) {
            student = await User.create({
                email: "student_demo@example.com",
                password: "password123",
                role: "student",
                name: "Vijay Sharma",
                skills: ["javascript", "react", "node.js"],
                cgpa: 8.5
            });
        }
        
        // 2. Find another student
        let student2 = await User.findOne({ email: "student_talent@example.com" });
        if (!student2) {
            student2 = await User.create({
                email: "student_talent@example.com",
                password: "password123",
                role: "student",
                name: "Ananya Iyer",
                skills: ["python", "machine learning", "pytorch"],
                cgpa: 9.2
            });
        }

        // 3. Find an internship for our current employer (viji26)
        const myUserId = "69de0b99d2c513c14dc3d8f6";
        const internships = await Internship.find({ employerId: myUserId });
        
        if (internships.length === 0) {
            console.log("❌ No internships found for user. Please post one first.");
            process.exit();
        }

        console.log(`📡 Seeding 2 applications for internship: ${internships[0].title}`);

        // 4. Create applications
        await Application.deleteMany({ internship: internships[0]._id }); // Clear previous for clean demo
        
        await Application.create([
            {
                internship: internships[0]._id,
                student: student._id,
                status: "waiting list",
                resume: "https://example.com/resume1.pdf"
            },
            {
                internship: internships[0]._id,
                student: student2._id,
                status: "pending",
                resume: "https://example.com/resume2.pdf"
            }
        ]);

        console.log("✅ Seeded 2 applicants successfully!");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedApplicants();
