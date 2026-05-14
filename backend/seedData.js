import mongoose from "mongoose";
import User from "./models/user.js";
import Internship from "./models/Internship.js";
import Application from "./models/Application.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/internship_db";

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        // 1. Create a demo institution if not exists
        let inst = await User.findOne({ role: "institution" });
        if (!inst) {
            inst = await User.create({
                name: "Oxford Engineering College",
                email: "admin@oxford.edu",
                password: "password123",
                role: "institution",
                university: "Oxford Engineering College"
            });
        }
        const instName = inst.university;

        // 2. Create Students with Departments
        const depts = ["CSE", "ECE", "IT", "MECH"];
        const students = [];
        for (let i = 0; i < 20; i++) {
            const dept = depts[i % depts.length];
            students.push({
                name: `Student ${i}`,
                email: `student${i}@test.com`,
                password: "password123",
                role: "student",
                university: instName,
                department: dept,
                skills: ["React", "Node.js", "Python"].slice(0, (i % 3) + 1),
                cgpa: 7 + (i % 3),
                gamification: { points: i * 25, badges: i > 10 ? ["AI Interviewer"] : [] },
                level: Math.floor((i * 25) / 100) + 1
            });
        }
        await User.insertMany(students);
        console.log("Students seeded.");

        // 3. Create Internships with Domains
        const employer = await User.findOne({ role: "employer" });
        if (employer) {
            const domains = ["AI/ML", "Web Dev", "Data Science", "Core Engineering"];
            const internships = [];
            for (let i = 0; i < 8; i++) {
                internships.push({
                    employerId: employer._id,
                    title: `${domains[i % domains.length]} Intern`,
                    description: "Exciting internship opportunity",
                    location: "Remote",
                    stipend: "10000",
                    duration: "3 months",
                    domain: domains[i % domains.length],
                    skills: ["React", "Python"]
                });
            }
            const savedInternships = await Internship.insertMany(internships);
            console.log("Internships seeded.");

            // 4. Create Applications (Placements)
            const allStudents = await User.find({ role: "student", university: instName });
            const apps = [];
            for (let i = 0; i < 10; i++) {
                apps.push({
                    student: allStudents[i]._id,
                    internship: savedInternships[i % 8]._id,
                    status: i < 7 ? "selected" : "pending"
                });
            }
            await Application.insertMany(apps);
            console.log("Applications seeded.");
        }

        console.log("Seed complete! Restart the server to see real-time Decision Intelligence.");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
