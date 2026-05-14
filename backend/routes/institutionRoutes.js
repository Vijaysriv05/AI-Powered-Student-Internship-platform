import express from "express";
import User from "../models/user.js";
import Institution from "../models/Institution.js";
import Application from "../models/Application.js";
import { auth } from "../middleware/authMiddleware.js";
import { sendMail } from "../config/mailer.js";
import { calculateMatchScore } from "../utils/recommendationEngine.js";

const router = express.Router();

/**
 * GET /api/institution/analytics
 * Fetches institutional analytics (students, placements, skill trends).
 */
router.get("/analytics", auth, async (req, res) => {
  try {
    // 🛡️ Robust Role Check (Case-Insensitive)
    const userRole = (req.user.role || "").toLowerCase().trim();
    if (userRole !== "institution") {
      console.warn(`🛑 [ANALYTICS] Access Denied for role: "${req.user.role}" (ID: ${req.user.id})`);
      return res.status(403).json({ message: "Access denied. Institution role required." });
    }

    // ✅ FETCH FULL CONTEXT: Prioritize Institution Name for analytics matching
    const userDoc = await User.findById(req.user.id);
    if (!userDoc) return res.status(404).json({ message: "User not found" });

    // Try all possible sources for the institution name
    let instName = userDoc.institutionName || "";
    
    if (!instName) {
      // Check the separate Institution collection
      const instProfile = await Institution.findOne({ userId: userDoc._id });
      if (instProfile) instName = instProfile.institutionName;
    }
    
    if (!instName) instName = userDoc.name || ""; // Final fallback

    instName = instName.trim();
    
    console.log(`📊 [ANALYTICS] Final Match Name: "${instName}" (Extracted from: ${userDoc.institutionName ? 'UserDoc' : 'Fallback'})`);

    if (!instName) {
      console.warn("⚠️ [ANALYTICS] No Institution Name found for account:", userDoc.email);
      return res.json({ totalStudents: 0, placements: 0, placementRate: 0, pendingApplications: 0 });
    }

    // ✅ ULTRA-FLEXIBLE MATCHING: Handles acronyms with or without dots (e.g., "V.S.B" matches "VSB")
    const cleanName = instName.replace(/\./g, "").trim();
    const words = cleanName.split(/\s+/).filter(w => w.length > 1);
    
    // Create a pattern that allows optional dots between letters of the first word (acronym)
    const acronymPart = words[0].split('').join('\\.?');
    const remainingPart = words.slice(1).join('.*');
    const fuzzyPattern = `${acronymPart}.*${remainingPart}`;
    
    const universityRegex = new RegExp(fuzzyPattern, 'i');
    console.log(`🔍 [ANALYTICS] Multi-Match Regex: /${fuzzyPattern}/i for "${instName}"`);

    console.log(`🔍 [ANALYTICS] Search Pattern: /${fuzzyPattern}/i`);

    // 1. Total Students - Using Flexible Regex for Real-Data Matching
    const institutionStudents = await User.find({ 
      role: "student", 
      $or: [
        { university: { $regex: universityRegex } },
        { university: { $regex: new RegExp(`^${instName.substring(0, 10)}`, 'i') } } // Fallback to first 10 chars
      ]
    });
    
    const studentIds = institutionStudents.map(s => s._id);
    const totalStudents = institutionStudents.length;
    console.log(`✅ [ANALYTICS] Found ${totalStudents} students matching criteria.`);

    if (totalStudents > 0) {
        console.log(`📋 [ANALYTICS] Sample Students: ${institutionStudents.slice(0, 3).map(s => s.name + " (" + s.university + ")").join(", ")}`);
    } else {
        // Log all student universities to help debug why none matched
        const allStudents = await User.find({ role: "student" }).limit(5);
        console.log(`❌ [ANALYTICS] NO MATCH. Typical students in DB: ${allStudents.map(s => s.university).join(" | ")}`);
    }

    // 2. Applications (All tied to this institution's students)
    const allApplications = await Application.find({ student: { $in: studentIds } })
      .populate({
          path: "internship",
          populate: { path: "employerId", model: "User", select: "companyName" }
      })
      .populate("student");
    const selectedApplications = allApplications.filter(a => a.status === "selected");
    const uniquePlacedStudents = [...new Set(selectedApplications.map(a => a.student._id.toString()))];
    const placementCount = selectedApplications.length;   // ✅ matches the popup list count
    const placementRate = totalStudents > 0 ? Math.round((uniquePlacedStudents.length / totalStudents) * 100) : 0;

    // 3. Detailed Data for Modals
    const pendingApps = allApplications.filter(a => a.status === "pending").map(a => ({
        studentName: a.student.name || a.student.email,
        studentEmail: a.student.email,
        internshipTitle: a.internship?.title || "Unknown",
        company: a.internship?.employerId?.companyName || "Unknown",
        skills: a.student.skills || [],
        matchScore: a.matchScore || calculateMatchScore(a.student, a.internship)
    }));

    const totalStudentsList = institutionStudents.map(s => ({
        name: s.name || s.full_name,
        email: s.email,
        dept: s.department || "N/A",
        status: uniquePlacedStudents.includes(s._id.toString()) ? "Placed" : "Searching"
    }));

    const placedStudentsList = allApplications
        .filter(a => a.status === "selected")
        .map(a => ({
            name: a.student.name || a.student.email,
            email: a.student.email,
            internship: a.internship?.title || "Internship",
            company: a.internship?.employerId?.companyName || "Company",
            dept: a.student.department || "N/A"
        }));

    // 4. Trends (Grouped by month)
    const trendMap = {};
    allApplications.forEach(app => {
        if (app.status === "selected") {
            const month = app.createdAt ? app.createdAt.toLocaleString('default', { month: 'short' }) : new Date().toLocaleString('default', { month: 'short' });
            trendMap[month] = (trendMap[month] || 0) + 1;
        }
    });
    const placementTrend = Object.keys(trendMap).map(k => ({ month: k, count: trendMap[k] }));
    if (placementTrend.length === 0) {
        placementTrend.push({ month: new Date().toLocaleString('default', { month: 'short' }), count: 0 });
    }

    // 5. Department-wise Stats
    const deptMap = {};
    institutionStudents.forEach(s => {
        const dept = s.department || "General";
        if (!deptMap[dept]) deptMap[dept] = { name: dept, total: 0, placed: 0 };
        deptMap[dept].total++;
        if (uniquePlacedStudents.includes(s._id.toString())) {
            deptMap[dept].placed++;
        }
    });
    const deptStats = Object.values(deptMap);

    // 6. Domain Distribution
    const domainCounts = {};
    allApplications.forEach(app => {
        const dom = app.internship?.domain || "General";
        domainCounts[dom] = (domainCounts[dom] || 0) + 1;
    });

    // 7. Preferred vs Rejected (Real Data Logic)
    const appStats = {}; // { title: { name, selected: 0, rejected: 0 } }
    allApplications.forEach(a => {
        const title = a.internship?.title || "Unknown";
        if (!appStats[title]) appStats[title] = { name: title, selected: 0, rejected: 0, count: 0 };
        appStats[title].count++;
        if (a.status === "selected") appStats[title].selected++;
        if (a.status === "rejected") appStats[title].rejected++;
    });
    
    const statsList = Object.values(appStats);
    // Sort by selected then total count
    const mostPreferred = statsList.sort((a,b) => b.selected - a.selected || b.count - a.count)[0];
    // Sort by rejected then total count, but ensure it's different from most preferred if possible
    const mostRejected = statsList
        .filter(s => statsList.length > 1 ? s.name !== mostPreferred?.name : true)
        .sort((a,b) => b.rejected - a.rejected || b.count - a.count)[0];

    const mostPreferredDisplay = mostPreferred ? `${mostPreferred.name} (${mostPreferred.selected} Selected)` : "Insufficient Data";
    const mostRejectedDisplay = mostRejected ? `${mostRejected.name} (${mostRejected.rejected} Rejected)` : "Insufficient Data";

    // Future Scope (Skills that caused rejections)
    const missingSkillsFreq = {};
    allApplications.filter(a => a.status === "rejected").forEach(a => {
        const reqSkills = a.internship?.skills || [];
        const stuSkills = a.student?.skills || [];
        const missing = reqSkills.filter(r => !stuSkills.some(s => s.toLowerCase() === r.toLowerCase()));
        missing.forEach(m => { missingSkillsFreq[m] = (missingSkillsFreq[m] || 0) + 1; });
    });
    let futureScopeCourses = Object.entries(missingSkillsFreq).sort((a,b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
    if (futureScopeCourses.length === 0) futureScopeCourses = ["Advanced AI/ML", "Cloud Systems"];

    // Top Candidates per Domain
    const domainToBestApp = {};
    allApplications.forEach(a => {
        const domain = a.internship?.domain || "General";
        const score = calculateMatchScore(a.student, a.internship); // Use the utility correctly
        if (!domainToBestApp[domain] || score > domainToBestApp[domain].score) {
            domainToBestApp[domain] = { 
                name: a.student.name || a.student.email, 
                score: score, 
                internship: a.internship?.title 
            };
        }
    });
    const topCandidates = Object.entries(domainToBestApp).map(([domain, data]) => ({
        domain,
        candidate: data.name,
        score: data.score,
        internship: data.internship
    }));

    // 8. Individual Monitoring
    const monitorData = institutionStudents.map(s => {
      const isPlaced = uniquePlacedStudents.includes(s._id.toString());
      const studentApps = allApplications.filter(a => a.student._id.toString() === s._id.toString());
      const readiness = Math.min(100, (s.skills?.length || 0) * 15 + (s.cgpa ? (s.cgpa / 10) * 25 : 0));
      return {
        id: s._id,
        name: s.full_name || s.name,
        email: s.email, // ✅ Needed for UI
        skills: s.skills?.slice(0, 3) || ["-"],
        readiness: Math.round(readiness),
        status: isPlaced ? "Placed" : (studentApps.length > 0 ? "Applied" : "Inactive"),
        atRisk: !isPlaced && (readiness < 40 || studentApps.length === 0),
        dept: s.department || "N/A"
      };
    });

    res.json({
      totalStudents,
      placementCount,
      placementRate,
      pendingAppsCount: pendingApps.length,
      pendingAppsDetails: pendingApps,
      placementTrend,
      deptStats,
      domainDist: Object.entries(domainCounts).map(([name, value]) => ({ name, value })),
      monitorData: monitorData.slice(0, 50),
      atRiskCount: monitorData.filter(m => m.atRisk).length,
      allStudentsList: totalStudentsList,
      placedStudentsList: placedStudentsList,
      advancedInsights: {
          mostPreferred: mostPreferredDisplay,
          mostRejected: mostRejectedDisplay,
          futureScopeCourses,
          topCandidates
      }
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ message: "Server error calculating analytics" });
  }
});

/**
 * POST /api/institution/send-notice
 * Sends a message/notification to a student and also an email.
 */
router.post("/send-notice", auth, async (req, res) => {
  try {
    const { studentId, message } = req.body;
    if (!studentId || !message) {
      return res.status(400).json({ message: "Student ID and message are required." });
    }

    const institutionHandle = await User.findById(req.user.id);
    const instName = institutionHandle.institutionName || institutionHandle.name || "Your Institution";

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found." });

    // 1. Persist to Dashboard
    student.notifications.push({
      message: message,
      from: instName,
      date: new Date(),
      read: false
    });
    await student.save();

    // 2. Send via Email
    try {
      await sendMail({
        to: student.email,
        subject: `New Notice from ${instName}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563eb;">Message from ${instName}</h2>
            <p style="font-size: 16px; color: #333;">${message}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">This notice was sent via the AI-Intern Platform.</p>
          </div>
        `
      });
    } catch (mailErr) {
      console.error("Mailing Notice Error:", mailErr);
    }

    res.json({ message: "Notice sent successfully!" });
  } catch (err) {
    console.error("Send Notice Error:", err);
    res.status(500).json({ message: "Server error sending notice." });
  }
});

export default router;
