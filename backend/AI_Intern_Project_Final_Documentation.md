# AI-Intern Platform: Final Project Documentation & Viva Guide

## 1. Project Overview
**Project Title:** AI-Intern: An Intelligent Internship Ecosystem
**Domain:** Web Development & Artificial Intelligence (AI)
**Problem Statement:** Traditionally, students lack a centralized platform to track applications and get career guidance, while institutions struggle to monitor placement success in real-time.
**Solution:** A three-tier web platform (Student, Employer, Institution) that uses AI to bridge the gap between education and employment.

---

## 2. Technology Stack (Implementation Details)

| Component | Technology | Specific Use Case |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JS | Core UI/UX and dynamic dashboard rendering. |
| **Backend** | Node.js & Express.js | Server-side logic, API routing, and system orchestration. |
| **Database** | MongoDB & Mongoose | NoSQL storage for users, jobs, and applications. |
| **Authentication** | JWT (JSON Web Tokens) | Secure, stateless login management. |
| **AI Processing** | OpenAI / Groq API | NLP-based resume parsing, mock interviews, and match insights. |
| **Visualizations** | Chart.js | Real-time graphs for placement trends and student distributions. |
| **File Handling** | Multer | Middleware for handling PDF resume and avatar uploads. |
| **Email Service** | Nodemailer | Sending automated notifications and alerts. |
| **Mobile Integration** | PWA (Service Workers) | Enabling mobile installation and offline capabilities. |

---

## 3. Core Algorithms Used

### A. The Weighted Recommendation Algorithm
*   **Functionality:** Powering the "Featured Internships" and "% Match" cards.
*   **Logic:** 
    *   **Skill Score (70%):** Calculates the overlap between student skills and job requirements.
    *   **CGPA Factor (25%):** Adjusts the score based on academic standing.
    *   **Dynamic Jitter (5%):** Adds a small random variance to make the score feel "live" and avoid identical scores.
*   **Formula:** `Final Score = (SkillsOverlap * 0.7) + (CGPA/10 * 0.25) + Random(0.05)`

### B. NLP Suitability Analysis (AI)
*   **Functionality:** The "AI Suitability Matcher" on the student profile.
*   **Logic:** Uses Natural Language Processing (OpenAI) to perform a semantic comparison between a student's unstructured resume text and a job description. It returns a JSON object containing a detailed score, feedback, and specific missing skills.

### C. Fuzzy Logic Search & Matching
*   **Functionality:** Used in the Institution Analytics to match students to specific colleges.
*   **Logic:** Uses Regular Expressions (Regex) to match institution names even if they have variations (e.g., "V.S.B" vs "VSB"). It ignores dots and extra spaces to ensure data accuracy.

### D. Skill Gap Algorithm
*   **Functionality:** Identifying learning paths.
*   **Logic:** A set-difference algorithm: `Missing_Skills = Job_Required_Skills - Student_Skills`. It then maps these missing skills to GeeksForGeeks learning links.

---

## 4. Key Functional Modules

### 🎓 Student Dashboard
- **Internship Discovery:** View jobs based on AI match scores.
- **AI Resume Matching:** Upload resume to get instant suitability feedback.
- **Mock Interviews:** Practice with an AI interviewer and get graded.
- **Gamification:** Earn badges (e.g., "Ready for Hire") based on profile completion.

### 🏢 Employer Dashboard
- **Job Posting:** Create and manage internship listings.
- **Applicant Ranking:** View candidates sorted by their AI suitability score.
- **Status Management:** Shortlist, Select, or Reject candidates in one click.

### 🏫 Institution Dashboard
- **Analytics Overview:** Real-time counters for Total Students vs. Placements.
- **Placement Rate:** Calculated as `(Unique Placed Students / Total Students) * 100`.
- **Auto-Refresh:** Dashboard polls the API every 30 seconds to update charts/numbers without page reload.
- **AI Strategic Reports:** Generates a professional PDF report summarizing the college's performance.

---

## 5. Security & System Design
- **JWT Security:** All sensitive routes are protected by an `auth` middleware. If the token is missing or expired, access is denied (401 Unauthorized).
- **Service Worker (PWA):** The `sw.js` file handles asset caching. When you update the project, we increment the `CACHE_NAME` (e.g., v1 to v2) to force the browser to clear old data.
- **Stateless Architecture:** The server does not store user sessions; it relies on the client sending the JWT token in the request header.

---

## 6. Common Viva Questions & Preparation

**Q1: How do you handle file uploads?**
*A: I use Multer middleware. It intercepts the multipart/form-data request, saves the file to the `/uploads` folder, and attaches the filename to the database record.*

**Q2: How does the "Live" dashboard update work?**
*A: I implemented client-side polling using `setInterval`. Every 30 seconds, it calls the `/api/institution/analytics` endpoint. To ensure the UI stays smooth, I destroy old Chart.js instances before rendering new ones to prevent overlapping.*

**Q3: What was the biggest challenge?**
*A: Managing the synchronization between the three user roles. I solved this by using a unified User model with a 'role' field and implementing role-based access control (RBAC) in the backend routes.*

**Q4: How does the AI Match Score stay below 100%?**
*A: I use a `Math.min(calculatedScore, 99)` logic. This ensures that even for a perfect candidate, the score feels realistic (99%) rather than a generic 100%.*

**Q5: Why is the page sometimes blank?**
*A: This usually happens due to browser caching of old broken CSS files or service worker conflicts. I implemented a cache-busting mechanism by bumping the Service Worker version to v2.*
