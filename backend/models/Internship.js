import mongoose from "mongoose";

const internshipSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    stipend: { type: String, default: "Unpaid" },
    duration: { type: String, required: true },

    // FINAL CONSISTENT FIELD (OPTION A)
    skills: {
      type: [String],
      default: [],
    },
    domain: { type: String, default: "General" }, // AI, Web, Data, Core etc.
  },
  { timestamps: true }
);

export default mongoose.model("Internship", internshipSchema);


// ✅ Export as default (important!)
//const Internship = mongoose.model("Internship", internshipSchema);
//export default Internship;





