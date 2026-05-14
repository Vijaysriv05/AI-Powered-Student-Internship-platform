import mongoose from "mongoose";

const employerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  companyName: { type: String, default: "" },
 companyEmail: { type: String, unique: true, required: true },
industry: { type: String, default: "" },
 website: { type: String, default: "" },
  description: { type: String, default: "" },
  views: { type: Number, default: 0 },
});

export default mongoose.model("Employer", employerSchema);









