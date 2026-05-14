import Application from "../models/Application.js";
import User from "../models/user.js";
import Internship from "../models/Internship.js"; // Needed to fetch skills for matching
import { sendStatusEmail } from "../utils/mailerUtils.js";
import { calculateMatchScore } from "../utils/recommendationEngine.js";

export const applyInternship = async (req, res) => {
  try {
    const { internshipId } = req.body;
    let resumeUrl = req.body.resume || "";
    
    // If a file was uploaded, use its path as the resume URL for demonstration
    if (req.file) {
      resumeUrl = `/uploads/${req.file.filename}`;
    }
    
    // Check if player already applied
    const existing = await Application.findOne({ internship: internshipId, student: req.user.id });
    if (existing) return res.status(400).json({ message: "Already applied for this internship" });

    // Fetch student and internship to calculate match score
    const student = await User.findById(req.user.id);
    const internship = await Internship.findById(internshipId);
    
    const matchScore = calculateMatchScore(student, internship);

    const application = await Application.create({
      internship: internshipId,
      student: req.user.id,
      resume: resumeUrl, 
      matchScore: matchScore // ✅ Persist the score
    });

    // 🎮 Gamification: Award 10 points for applying
    await User.findByIdAndUpdate(req.user.id, { 
      $inc: { "gamification.points": 10 } 
    });

    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: "Error applying", error: err.message });
  }
};

export const getApplications = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;
    const applications = await Application.find({ student: studentId })
      .populate({
        path: "internship",
        populate: {
          path: "employerId",
          model: "User", // Corrected to User model
          select: "name full_name email companyName"
        }
      })
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ message: "Error fetching applications", error: err.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ message: "Status is required" });

    const application = await Application.findById(id).populate("student").populate("internship");
    if (!application) return res.status(404).json({ message: "Application not found" });

    application.status = status;
    await application.save();

    // 📧 Notification (Non-blocking & Silent Failure)
    try {
      // Need employer info to personalize it
      const populatedApp = await Application.findById(id)
        .populate("student")
        .populate({
            path: "internship",
            populate: { path: "employerId", model: "User", select: "name full_name companyName" }
        });
      
      const studentEmail = populatedApp.student?.email;
      const studentName = populatedApp.student?.name || populatedApp.student?.full_name || "Student";
      const internshipTitle = populatedApp.internship?.title || "Internship";
      
      // Handle various company name fields
      const companyName = populatedApp.internship?.employerId?.companyName || 
                          populatedApp.internship?.employerId?.full_name || 
                          populatedApp.internship?.employerId?.name || 
                          "the employer";

      if (studentEmail) {
        // Send email via mailer utility asynchronously
        sendStatusEmail(studentEmail, studentName, companyName, status, internshipTitle);
      }
    } catch (emailErr) {
      console.error("❌ Email notification failure (non-blocking):", emailErr.message);
    }

    res.json({ message: "Status updated successfully.", application });
  } catch (err) {
    console.error("❌ updateApplicationStatus ERROR:", err);
    res.status(500).json({ message: "Error updating status", error: err.message });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id);
    
    if (!application) return res.status(404).json({ message: "Application not found" });
    
    // Check if user is the student who applied
    if (application.student.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this application" });
    }

    await Application.findByIdAndDelete(id);
    res.json({ message: "Application withdrawn successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting application", error: err.message });
  }
};

