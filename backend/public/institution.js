// ---------------- Institution Dashboard ----------------

// Default Top Applicant (if no students added)
const defaultTopApplicants = [
  { name: "Ananya Sharma", skills: "Data Analysis, SQL", matchScore: 90 }
];

// ---------------- Collapsible Panels ----------------
document.querySelectorAll(".collapsible").forEach(btn => {
  btn.addEventListener("click", function () {
    this.classList.toggle("active");
    const content = this.nextElementSibling;
    content.style.display = content.style.display === "block" ? "none" : "block";
  });
});

// Header shrink on scroll
window.addEventListener('scroll', () => {
  document.getElementById('siteHeader').classList.toggle('shrink', window.scrollY > 120);
});

// ---------------- Particle Animation ----------------
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = 420;
const particles = [];
for (let i = 0; i < 50; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 1,
    dx: (Math.random() - 0.5) / 2,
    dy: (Math.random() - 0.5) / 2
  });
}
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.x += p.dx;
    p.y += p.dy;
    if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();
  });
  requestAnimationFrame(animate);
}
animate();
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = 420; });

// ---------------- Load Dashboard ----------------
function loadDashboard() {
  const programs = JSON.parse(localStorage.getItem("programs") || "[]");
  const students = JSON.parse(localStorage.getItem("students") || "[]");

  // Programs
  document.getElementById("programCount").textContent = programs.length;
  const programCards = document.getElementById("programCards");
  programCards.innerHTML = "";
  if (programs.length === 0) {
    programCards.innerHTML = "<div class='card'>No programs added yet.</div>";
  } else {
    programs.forEach(p => {
      const div = document.createElement("div");
      div.className = "card";
      div.textContent = `${p.title} - ${p.seats} Seats`;
      programCards.appendChild(div);
    });
  }

  // Students
  document.getElementById("studentCount").textContent = students.length;
  const studentList = document.getElementById("studentList");
  studentList.innerHTML = "";
  const displayStudents = students.length > 0 ? [students[0]] : defaultTopApplicants;
  displayStudents.forEach(s => {
    const li = document.createElement("li");
    li.textContent = `${s.name} - ${s.skills} (Score: ${s.matchScore}%)`;
    studentList.appendChild(li);
  });

  // Analytics
  document.getElementById("totalApplications").textContent = students.length;
  const totalSeats = programs.reduce((a, p) => a + p.seats, 0);
  document.getElementById("seatsFilled").textContent = Math.min(students.length, totalSeats);
  const avgScore = students.length ? Math.round(students.reduce((a, s) => a + s.matchScore, 0) / students.length) : 0;
  document.getElementById("averageScore").textContent = avgScore + "%";

  // Profile Completion Bar
  const completion = Math.min(100, Math.round((students.length + programs.length) / 10 * 10));
  const progressFill = document.getElementById("dashboardCompletion");
  if (progressFill) progressFill.style.width = completion + "%";
  if (progressFill) progressFill.textContent = completion + "%";
}
loadDashboard();

// ---------------- Add Program ----------------
document.getElementById("programForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const title = document.getElementById("programTitle").value.trim();
  const seats = parseInt(document.getElementById("programSeats").value);
  if (!title || isNaN(seats) || seats < 1) return alert("Enter valid program details");
  const programs = JSON.parse(localStorage.getItem("programs") || "[]");
  programs.push({ title, seats });
  localStorage.setItem("programs", JSON.stringify(programs));
  document.getElementById("programTitle").value = "";
  document.getElementById("programSeats").value = "";
  loadDashboard();
});

// ---------------- Add Student ----------------
document.getElementById("studentForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("studentName").value.trim();
  const skills = document.getElementById("studentSkills").value.trim();
  const matchScore = parseInt(document.getElementById("matchScore").value);
  if (!name || !skills || isNaN(matchScore) || matchScore < 0 || matchScore > 100) return alert("Enter valid student details");
  const students = JSON.parse(localStorage.getItem("students") || "[]");
  students.push({ name, skills, matchScore });
  localStorage.setItem("students", JSON.stringify(students));
  document.getElementById("studentName").value = "";
  document.getElementById("studentSkills").value = "";
  document.getElementById("matchScore").value = "";
  loadDashboard();
});

// ---------------- Load Institution Profile ----------------
async function loadInstitutionProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("/api/institutions/profile", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error("Unauthorized: Invalid or expired token");
      else throw new Error("Failed to fetch profile from server");
    }

    const data = await res.json();
    const user = data.user;

    // Populate profile card
    document.getElementById("institutionNameCard").textContent = user.name || "Institution Name";
    document.getElementById("institutionEmailCard").textContent = user.email || "email@institution.com";
    document.getElementById("domainCard").textContent = user.domain || "Domain";
    const logo = document.getElementById("institutionLogo");
    if (logo) logo.src = user.avatar || "https://cdn-icons-png.flaticon.com/512/235/235347.png";

  } catch (err) {
    console.error("Error loading institution profile:", err);
    alert("Failed to load institution profile. Check console for details.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  loadInstitutionProfile();
});
