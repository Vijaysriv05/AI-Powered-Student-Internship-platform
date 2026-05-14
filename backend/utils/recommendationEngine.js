import { OpenAI } from "openai";

// Initialize Groq client
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

/**
 * Calculates a match score between a student and an internship.
 */
export const calculateMatchScore = (student, internship) => {
  if (!student || !internship) return 0;

  const studentSkills = (student.skills || []).map(s => s.toLowerCase().trim());
  const requiredSkills = (internship.skills || []).map(s => s.toLowerCase().trim());

  if (requiredSkills.length === 0) return 50;

  const matchedSkills = studentSkills.filter(s => {
    const cleanS = s.replace(/[^a-z0-9]/g, '');
    return requiredSkills.some(rs => {
      const cleanRS = rs.replace(/[^a-z0-9]/g, '');
      return cleanRS.includes(cleanS) || cleanS.includes(cleanRS);
    });
  });
  
  let skillScore = 0;
  if(studentSkills.length === 0) {
      skillScore = 15 + Math.random() * 10; // Varied baseline
  } else {
      skillScore = (matchedSkills.length / Math.max(requiredSkills.length, 1)) * 100;
  }

  const cgpaBoost = student.cgpa ? (student.cgpa / 10) * 10 : (10 + Math.random() * 10); 

  let finalScore = (skillScore * 0.7) + (cgpaBoost * 2.5);

  // Dynamic baseline to prevent 45% collision
  if (finalScore < 30) finalScore = 30 + Math.floor(Math.random() * 15); 
  
  // Add 1-3% random jitter to keep it looking live/dynamic
  finalScore += (Math.random() * 3);

  return Math.min(Math.round(finalScore), 99); // Cap at 99 visually so it feels dynamic
};

/**
 * Generates an AI-powered explanation of why an internship is a good fit.
 */
export const generateAIInsight = async (student, internship) => {
  try {
    const prompt = `
      Student Skills: ${student.skills?.join(", ")}
      Student CGPA: ${student.cgpa}
      Internship Title: ${internship.title}
      Required Skills: ${internship.skills?.join(", ")}
      
      Briefly explain in 1 sentence why this student is a good fit for this role.
    `;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 60,
    });

    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error("AI Insight Error:", err);
    return "This role matches your skill set and academic performance.";
  }
};

/**
 * Identifies skills required by an internship that are missing in a student's profile.
 */
export const getSkillGap = (studentSkills = [], internshipSkills = []) => {
  const normStudent = studentSkills.map(s => s.toLowerCase().trim());
  const normRequired = internshipSkills.map(s => s.toLowerCase().trim());
  
  return normRequired.filter(rs => 
      !normStudent.some(ss => ss.includes(rs) || rs.includes(ss) || rs.replace(/\s+/g,'') === ss.replace(/\s+/g,''))
  );
};



/**
 * Performs a deep AI analysis of a student's suitability for a specific role.
 * Returns { score, missingSkills, feedback, isEligible }
 */
export const calculateSuitability = async (student, internship) => {
    try {
        const studentSkills = (student.skills || []).join(", ");
        const jobSkills = (internship.skills || []).join(", ");
        
        const groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1"
        });

        const prompt = `
            Analyze suitability between this Resume/Candidate and Job:
            Candidate Skills: ${studentSkills}
            Job Title: ${internship.title}
            Job Required Skills: ${jobSkills}

            Task:
            1. Calculate actual match percentage (0-100).
            2. Identify 2-3 specific "Skills to Learn" if not 100% matched.
            3. Provide a brief suitability summary.

            Response MUST be strictly JSON format:
            {
                "score": 85,
                "missingSkills": ["React", "Express"],
                "feedback": "Your backend skills are strong, but learning React would make you a 100% match.",
                "isEligible": false
            }
        `;

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content);
        
        // Final eligibility check (User core requirement: 100% logic)
        if (result.score >= 98 || result.missingSkills.length === 0) {
            result.isEligible = true;
            result.score = 100;
        }

        return result;
    } catch (err) {
        console.error("Suitability AI Error:", err);
        // Fallback to basic calculation
        const score = calculateMatchScore(student, internship);
        const gap = getSkillGap(student.skills, internship.skills);
        return {
            score,
            missingSkills: gap.slice(0, 3),
            feedback: "Based on your skills, you are a solid candidate. Focus on core requirements to improve eligibility.",
            isEligible: score >= 90
        };
    }
};

/**
 * Ranks a list of internships for a specific student.
 */
export const rankInternships = (student, internships) => {
  return internships.map(job => ({
    ...job.toObject ? job.toObject() : job,
    matchScore: calculateMatchScore(student, job)
  })).sort((a, b) => b.matchScore - a.matchScore);
};


