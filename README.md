<div align="center">
  <img src="https://media.istockphoto.com/id/1477722769/photo/ai-technology-concept-man-uses-holographic-interface-business-analytics-and-global-technology.jpg?s=612x612&w=0&k=20&c=FWpY5XtogS-lEyPMtJz-AYZko2lAWlF49wksQQGaCss=" alt="AI-Intern Banner" width="600"/>

  # 🚀 AI-Powered Student Internship & Career Hub
  
  **A Multi-Tenant Progressive Web App (PWA) connecting Students, Institutions, and Employers through Data-Driven AI Matching.**

  [![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Render-blue?style=for-the-badge&logo=render)](https://ai-powered-student-internship-platform.onrender.com)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
  [![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](#)

  <br/>

  ### 🌐 **Live Web Application:** [https://ai-powered-student-internship-platform.onrender.com](https://ai-powered-student-internship-platform.onrender.com)

</div>

<br/>

## 📖 Overview

The **AI-Powered Student Internship Platform** is a sophisticated, end-to-end career ecosystem designed to bridge the gap between fresh talent and top-tier companies. It moves beyond traditional job boards by integrating **Natural Language Processing (NLP)** and **Machine Learning APIs** to automate candidate screening, identify skill gaps, and provide real-time career guidance.

Built as a **Progressive Web App (PWA)**, the platform guarantees a seamless, app-like experience across desktop and mobile devices without the overhead of native app store deployment.

---

## ✨ Key Features

### 🎯 AI Resume Suitability Matcher
- **Automated Parsing:** Extracts core technical and soft skills directly from uploaded resumes (PDF/DOCX).
- **Semantic Matching algorithm:** Computes a "Match Score" against specific internship requirements.
- **Skill-Gap Analysis:** Dynamically highlights missing skills and suggests learning paths for candidates falling below the threshold.

### 🤖 Intelligent Career Chatbot
- **Context-Aware NLP:** Utilizes OpenAI to answer complex career queries, suggest interview strategies, and provide job market insights.
- **Voice-to-Text & Text-to-Speech:** Integrated Web Speech APIs allow for a fully hands-free, multilingual conversational experience.

### 👥 Multi-Tenant Architecture
- **Student Portal:** Resume builder, gamification engine (streaks, badges, points), and application tracker.
- **Employer Portal:** Automated shortlisting, candidate analytics, and one-click internship posting.
- **Institution Dashboard:** Real-time analytics (via Chart.js) tracking student placements and global platform impact.

### 🔔 Real-Time Operations
- **Smart Notification Relay:** Secure, targeted messaging system between institutions, employers, and students.
- **Gamified Engagement:** Automated progression system rewarding students for upskilling and consistency.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Chart.js, PWA Manifest & Service Workers |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **AI & NLP** | OpenAI API, string-similarity (Scoring Engine) |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs |
| **Utilities** | Multer (File Uploads), Nodemailer (Email Relay), Web Speech API |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- An [OpenAI API Key](https://platform.openai.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Vijaysriv05/AI-Powered-Student-Internship-platform.git
   cd AI-Powered-Student-Internship-platform
   ```

2. **Navigate to the backend and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `backend` directory and add the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   OPENAI_API_KEY=your_openai_api_key
   GMAIL_USER=your_email@gmail.com
   GMAIL_PASS=your_app_password
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Access the application:**
   Open your browser and navigate to `http://localhost:5000`

---

## 📱 Mobile Accessibility via QR Code
This project is fully optimized for mobile devices as a Progressive Web App (PWA). Instead of requiring a traditional app store installation, users can access the entire platform instantly:
1. Scan the **QR Code** provided on the platform's home page.
2. The platform will open in your mobile browser, functioning immediately as a seamless, native-feeling application.

---

<div align="center">
  <i>Designed and Developed for seamless career advancement.</i>
</div>
