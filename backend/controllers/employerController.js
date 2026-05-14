import Internship from "../models/Internship.js";
import Employer from "../models/Employer.js";

/* ===========================================================
   CREATE INTERNSHIP  ✅
   =========================================================== */
export const createInternship = async (req, res) => {
  try {
    let { title, description, skills, duration, stipend, location } = req.body;

    // ⭐ FIX SKILLS REQUIRED BECAUSE FRONTEND SENDS STRING
    if (!Array.isArray(skills)) {
      skills = skills
        .split(",")
        .map(s => s.trim().toLowerCase());
    }

    const newInternship = new Internship({
      employerId: req.user._id,
      title,
      description,
      skills,
      duration,
      stipend,
      location,
    });

    await newInternship.save();
    res.json({ message: "Internship Created Successfully!" });
  } catch (err) {
    console.error("❌ Error in createInternship controller:", err);
    res.status(500).json({ message: "Server error while creating internship" });
  }
};


/* ===========================================================
   GET ALL INTERNSHIPS FOR EMPLOYER
   =========================================================== */
export const getEmployerInternships = async (req, res) => {
  try {
    const employerId = req.user?._id;

    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized: Employer not found" });
    }

    const internships = await Internship.find({ employerId }).sort({ createdAt: -1 });
    res.json({ internships });
  } catch (err) {
    console.error("❌ Error fetching internships:", err);
    res.status(500).json({ message: "Server error fetching internships" });
  }
};

/* ===========================================================
   DELETE INTERNSHIP
   =========================================================== */
export const deleteInternship = async (req, res) => {
  try {
    const { id } = req.params;
    const employerId = req.user?._id;

    if (!employerId) {
      return res.status(401).json({ message: "Unauthorized request" });
    }

    const internship = await Internship.findOneAndDelete({ _id: id, employerId });

    if (!internship) {
      return res
        .status(404)
        .json({ message: "Internship not found or unauthorized" });
    }

    res.json({ message: "✅ Internship deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting internship:", err);
    res.status(500).json({ message: "Server error deleting internship" });
  }
  
};
export const getAllInternships = async (req, res) => {
  try {
    const employerId = req.user.id; // from JWT auth
    const internships = await Internship.find({ employerId });
    res.json(internships);
  } catch (err) {
    console.error("❌ Error fetching internships:", err);
    res.status(500).json({ message: "Server error fetching internships" });
  }
};


