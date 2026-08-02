async function loadProfile() {
  const email = sessionStorage.getItem("userEmail");
  if (!email) return window.location.href = "login.html";

  try {
    const res = await fetch(`/api/users/${email}`);
    if (!res.ok) throw new Error("Failed to fetch user data");
    const data = await res.json();

    // Update dashboard info if elements exist
    if (document.getElementById("dashboardName")) document.getElementById("dashboardName").textContent = data.name;
    if (document.getElementById("dashboardAvatar")) document.getElementById("dashboardAvatar").src = data.avatar || "default.png";
    if (document.getElementById("dashboardNameCard")) document.getElementById("dashboardNameCard").textContent = data.name;
    if (document.getElementById("dashboardAvatarCard")) document.getElementById("dashboardAvatarCard").src = data.avatar || "default.png";
    if (document.getElementById("dashboardUniversityCard")) {
        document.getElementById("dashboardUniversityCard").textContent = data.university ? `🎓 ${data.university}` : "";
    }
    if (document.getElementById("dashboardDeptCard")) {
        document.getElementById("dashboardDeptCard").textContent = data.department ? data.department : "";
    }

    if (document.getElementById("coursesStatus")) document.getElementById("coursesStatus").textContent = `Courses: ${data.courses.length}`;
    if (document.getElementById("resumeStatus")) document.getElementById("resumeStatus").textContent = data.resume ? "Resume: Uploaded" : "Resume: Not uploaded";

    if (document.getElementById("dashboardProfileProgress")) {
      const progress = Math.round(([data.name, data.avatar, data.university, data.resume, data.courses.length].filter(Boolean).length / 5) * 100);
      const bar = document.getElementById("dashboardProfileProgress");
      bar.style.width = progress + "%";
      bar.textContent = progress + "%";
    }

    // Gamification
    if (document.getElementById("points")) document.getElementById("points").textContent = data.gamification.points;
    if (document.getElementById("badges")) document.getElementById("badges").textContent = data.gamification.badges.join(", ") || "None";
    if (document.getElementById("streak")) document.getElementById("streak").textContent = data.gamification.streak + " days";

  } catch (err) {
    console.error("Error loading profile:", err);
    window.location.href = "login.html";
  }
}

document.addEventListener("DOMContentLoaded", loadProfile);
