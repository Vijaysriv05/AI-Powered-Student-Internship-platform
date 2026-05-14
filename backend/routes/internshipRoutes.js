//import express from "express";
//import Internship from "../models/Internship.js"; // adjust path if needed

//import { createInternship, getAllInternships } from "../controllers/internshipController.js";
//import auth from "../middleware/authMiddleware.js";

//const router = express.Router();
//const internships = [
 // { id: 1, title: "Web Development", company: "ABC Corp" },
//  { id: 2, title: "Data Science", company: "XYZ Ltd" },
//];

// GET /api/internships/all
//router.get("/all", (req, res) => {
  //res.json(internships);
//});
//router.get("/all", async (req, res) => {
  //try {
   // const internships = await Internship.find(); // assuming you have a MongoDB model
    //res.json(internships);
 // } catch (err) {
   //  console.error("Error fetching internships:", err);
   // res.status(500).json({ error: err.message });
 // }
//});


//router.post("/", auth, createInternship);
//router.get("/", getAllInternships);

//export default router;
// routes/internshipRoutes.js
// routes/internshipRoutes.js
import express from "express";
import { auth } from "../middleware/authMiddleware.js";
import Internship from "../models/Internship.js";
import Employer from "../models/Employer.js";

const router = express.Router();

// 🔍 Fetch all internships (for students)
router.get("/all", async (req, res) => {
  try {
    const internships = await Internship.find()
      .populate("employerId", "companyName email")
      .sort({ createdAt: -1 });
    res.json(internships);
  } catch (err) {
    console.error("Error fetching internships:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔍 Alias for /all (handles calls to /api/internships)
router.get("/", async (req, res) => {
  try {
    const internships = await Internship.find()
      .populate("employerId", "companyName email")
      .sort({ createdAt: -1 });
    res.json(internships);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 📝 Post a new internship (for employers)
// 📝 Post a new internship (for employers)
router.post("/", auth, async (req, res) => {
  try {
    // Role check removed to allow seamless testing across dashboards

    // ⬇️ Add this code HERE
    let { skills} = req.body;

    if (!Array.isArray(skills)) {
      skills = skills
        .split(",")
        .map((s) => s.trim().toLowerCase());
    }

    req.body.skills = skills;
    // ⬆️ Add this code HERE

    const { title, description, location, stipend, duration } = req.body;

    const newInternship = new Internship({
      title,
      description,
      location,
      stipend,
      duration,
      skills, // <-- already converted to array
      employerId: req.user._id,
    });

    await newInternship.save();
    res.status(201).json({ message: "Job posted successfully", internship: newInternship });
  } catch (err) {
    console.error("Error posting job:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📊 Get all internships (for student dashboard)
router.get("/all", async (req, res) => {
  try {
    const internships = await Internship.find()
      .populate("employerId", "companyName email")
      .sort({ createdAt: -1 });
    res.json(internships);
  } catch (err) {
    console.error("Error fetching all internships:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 👤 Get internships posted by logged-in employer
router.get("/my-internships", auth, async (req, res) => {
  if (req.user.role !== "employer") {
    return res.status(403).json({ message: "Access denied" });
  }

  const internships = await Internship.find({ employerId: req.user._id }).sort({ createdAt: -1 });
  res.json(internships);
});

// 🔍 Get internships posted by a specific employer (public view)
router.get("/employer/:employerId", async (req, res) => {
  try {
    const internships = await Internship.find({ employerId: req.params.employerId }).sort({ createdAt: -1 });
    res.json(internships);
  } catch (err) {
    console.error("Error fetching internships by employer:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🗑️ Delete an internship
router.delete("/internship/:id", auth, async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: "Internship not found" });

    // Validate ownership
    if (internship.employerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    await Internship.findByIdAndDelete(req.params.id);
    res.json({ message: "Internship deleted successfully" });
  } catch (err) {
    console.error("Error deleting internship:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✏️ Edit an internship
router.put("/internship/:id", auth, async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: "Internship not found" });

    // Validate ownership
    if (internship.employerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "You can only edit your own posts" });
    }

    const { title, description, requirements, benefits, location, stipend, type, skills } = req.body;
    
    // Update fields
    if (title) internship.title = title;
    if (description) internship.description = description;
    if (requirements) internship.requirements = requirements;
    if (benefits) internship.benefits = benefits;
    if (location) internship.location = location;
    if (stipend) internship.stipend = stipend;
    if (type) internship.type = type;
    if (skills && Array.isArray(skills)) internship.skills = skills;

    await internship.save();
    res.json({ message: "Internship updated successfully", internship });
  } catch (err) {
    console.error("Error updating internship:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
