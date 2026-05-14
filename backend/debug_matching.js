import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Define Schemas to avoid issues
const userSchema = new mongoose.Schema({
  name: String,
  role: String,
  university: String,
  institutionName: String
});
const User = mongoose.model('User', userSchema);

async function debug() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('--- DB DEBUG START ---');

  const user = await User.findOne({ email: 'viji2@gmail.com' });
  const instName = (user.institutionName || user.name || '').trim();
  console.log('Institution Name to use:', instName);

  const cleanName = instName.replace(/\./g, '').trim();
  const words = cleanName.split(/\s+/).filter(w => w.length > 1);
  const acronymPart = words[0].split('').join('\\.?');
  const remainingPart = words.slice(1).join('.*');
  const fuzzyPattern = acronymPart + '.*' + remainingPart;
  const universityRegex = new RegExp(fuzzyPattern, 'i');
  
  console.log('Generated Regex:', fuzzyPattern);

  const students = await User.find({ role: 'student' });
  console.log('Total students in DB:', students.length);

  const matches = students.filter(s => universityRegex.test(s.university));
  console.log('Matches Count:', matches.length);
  if (matches.length > 0) {
    console.log('Sample Match:', matches[0].name, 'University:', matches[0].university);
  } else {
    console.log('Sample Student University in DB:', students[0].university);
  }

  process.exit();
}

debug();
