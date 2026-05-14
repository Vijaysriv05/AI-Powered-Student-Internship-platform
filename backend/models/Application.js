// models/Application.js
import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    internship: { type: mongoose.Schema.Types.ObjectId, ref: "Internship", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "waiting list", "shortlisted", "selected", "rejected"],
      default: "pending",
    },
    matchScore: { type: Number, default: 0 },
    resume: { type: String, default: "" },
  },
  { timestamps: true }
);

const Application = mongoose.model("Application", applicationSchema);

export default Application;
