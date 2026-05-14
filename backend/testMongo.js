// testMongo.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGO_URI; // Make sure this is in your .env file

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("✅ MongoDB connected successfully!");
  process.exit(0);
})
.catch(err => {
  console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
});

