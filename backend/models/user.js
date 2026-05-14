import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Basic login info
    username: { type: String, unique: true, sparse: true }, // optional username
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed password

    // Profile info
    full_name: { type: String, default: "" },
    name: { type: String, default: "" }, // alternative display name
    avatar: { type: String, default: "" },
    university: { type: String, default: "" },
    resume: { type: String, default: "" },
    courses: { type: [String], default: [] },

    // OAuth / third-party login
    googleId: { type: String, default: "" },

    // Role management
    role: {
      type: String,
      enum: ["student", "employer", "institution"],
      required: true,
    },

    // Flexible profile data (JSON-like)
    profile_data: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Gamification fields
    gamification: {
      points: { type: Number, default: 0 },
      badges: { type: [String], default: [] },
      streak: { type: Number, default: 0 },
      lastActive: { type: Date, default: null },
    },

    // ----- Student-specific fields (added for AI Recommendation) -----
    skills: { type: [String], default: [] },
    cgpa: { type: Number, default: 0 },
    studentStatus: { type: String, enum: ["College Student", "College Completed", "None"], default: "None" },
    department: { type: String, default: "" }, // e.g., CSE, ECE, IT

    // Gamification level
    level: { type: Number, default: 1 },

    // ----- Employer-specific fields -----
    companyName: { type: String, default: "" },
    industry: { type: String, default: "" },
    website: { type: String, default: "" },
    employees: { type: Number, default: 0 },
    description: { type: String, default: "" },
    certificates: { type: [String], default: [] },

    // ----- Institution-specific fields -----
    institutionName: { type: String, default: "" },
    institutionType: { type: String, default: "" }, // e.g., College, University
    studentsCount: { type: Number, default: 0 },
    institutionDescription: { type: String, default: "" },

    // ----- Notifications/Notices System -----
    notifications: [
      {
        message: { type: String, required: true },
        from: { type: String, default: "Institution" },
        date: { type: Date, default: Date.now },
        read: { type: Boolean, default: false }
      }
    ],
  },
  { timestamps: true }
);

// ✅ Prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;




