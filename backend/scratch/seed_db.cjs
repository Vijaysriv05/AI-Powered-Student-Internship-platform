const mongoose = require('mongoose');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const User = mongoose.model('User', new mongoose.Schema({
    email: String,
    role: String,
    name: String,
    skills: [String],
    cgpa: Number,
    companyName: String,
    gamification: { points: Number, badges: [String], streak: Number, lastActive: Date },
    avatar: String,
    university: String
  }, { strict: false }));
  
  const Internship = require('../models/Internship.js').default || require('../models/Internship.js');
  const Application = require('../models/Application.js').default || require('../models/Application.js');

  // Find users
  const student = await User.findOne({ email: 'viji25@gmail.com' });
  const employer = await User.findOne({ email: 'viji26@gmail.com' });

  if (employer) {
    employer.companyName = 'TechNova Solutions';
    employer.name = 'Hr Manager';
    await employer.save();
    
    // Clear and create internships
    await Internship.deleteMany({});
    await Application.deleteMany({});
    
    const internships = [
      {
        employerId: employer._id,
        title: 'Full Stack Web Developer Intern',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        location: 'Remote',
        stipend: '₹15,000/month',
        duration: '3 months',
        description: 'Join our dynamic team to build cutting-edge web applications. You will be working across the stack from React frontends to Node backends.',
      },
      {
        employerId: employer._id,
        title: 'Machine Learning Engineering Intern',
        skills: ['Python', 'TensorFlow', 'Data Science', 'Machine Learning'],
        location: 'Bangalore / Hybrid',
        stipend: '₹20,000/month',
        duration: '6 months',
        description: 'Help develop and train sophisticated AI models to solve real-world industry problems.',
      },
      {
        employerId: employer._id,
        title: 'UI/UX Design Intern',
        skills: ['Figma', 'Prototyping', 'User Research', 'Wireframing'],
        location: 'Remote',
        stipend: '₹10,000/month',
        duration: '2 months',
        description: 'Craft intuitive and beautiful digital experiences. Work closely with product managers and engineers.',
      }
    ];
    
    const createdInternships = await Internship.insertMany(internships);
    console.log('✅ Inserted Internships');

    // Make student apply to one
    if (student) {
      await Application.create({
         student: student._id,
         internship: createdInternships[0]._id, // Apply to Full Stack Web Developer
         status: 'pending'
      });
      console.log('✅ Inserted Application');
    }
  }

  if (student) {
    student.skills = ['JavaScript', 'React', 'Node.js', 'Python'];
    student.cgpa = 8.5;
    student.name = "Vijay Sharma";
    student.university = "National Institute of Technology";
    student.avatar = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
    student.gamification = {
      points: 150,
      badges: ['Resume Uploaded', 'Course Pro', 'Top Applicant'],
      streak: 7,
      lastActive: new Date()
    };
    await student.save();
    console.log('✅ Updated Student Profile');
  }

  process.exit();
}

seed();
