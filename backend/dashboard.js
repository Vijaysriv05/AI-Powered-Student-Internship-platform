// js/dashboard.js
async function loadProfile() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("❌ No token found, please login again.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/profile/profile", {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const user = await res.json();

    if (res.ok) {
      // Show user-specific data
      document.getElementById("profileName").textContent = user.full_name || user.username;
      document.getElementById("profileEmail").textContent = user.email;
      document.getElementById("profileRole").textContent = user.role;
    } else {
      alert(user.message || "❌ Failed to load profile");
      window.location.href = "login.html";
    }
  } catch (err) {
    console.error("❌ Error loading profile:", err);
    alert("❌ Error loading profile. Please login again.");
    window.location.href = "login.html";
  }
}

loadProfile();
