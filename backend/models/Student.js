import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  university: { type: String, default: "" },
  contactEmail: { type: String },
  avatar: { type: String, default: "" },
  resume: { type: String, default: "" },
  certificates: [{ type: String }],
});

export default mongoose.model("Student", studentSchema);


