import mongoose from "mongoose";

const institutionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  institutionName: { type: String, default: "" },
  contactEmail: { type: String },
  website: { type: String, default: "" },
  description: { type: String, default: "" },
  studentsCount: { type: Number, default: 0 },
});

export default mongoose.model("Institution", institutionSchema);


