// employer.js
const fields = ["companyName","companyEmail","industry","website","employees","description"];
const logo = document.getElementById("logo");
const saveBtn = document.getElementById("saveProfile");

// JWT token after login
const token = localStorage.getItem("token");
if (!token) {
  alert("You are not logged in!");
  window.location.href = "/login.html"; // redirect to login
}

// ==================== Load profile (existing logic) ====================
async function loadProfile() {
  try {
    const res = await fetch("/api/auth/profile", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Failed to fetch profile");

    const data = await res.json();
    const user = data.user; // User fields
    const employerProfile = user?.role === "employer" ? user.employer : null;

    // Set User fields
    document.getElementById("companyEmail").value = user?.email || "";

    // Set Employer fields
    if (employerProfile) {
      document.getElementById("companyName").value = employerProfile.companyName || "";
      document.getElementById("industry").value = employerProfile.industry || "";
      document.getElementById("website").value = employerProfile.website || "";
      document.getElementById("employees").value = employerProfile.employees || "";
      document.getElementById("description").value = employerProfile.description || "";
      if (employerProfile.avatar) logo.src = employerProfile.avatar;
    }

    updateProfileCompletion();
    updatePreview();
  } catch (err) {
    console.error("Error fetching employer profile:", err);
    alert("Network error while loading profile. Please login again.");
    window.location.href = "/login.html";
  }
}

// ==================== Save profile ====================
async function saveProfile() {
  const payload = {};
  fields.forEach(id => { payload[id] = document.getElementById(id).value; });
  payload.avatar = logo.src;

  try {
    const res = await fetch("/api/auth/profile", { // keep consistent with loadProfile
      method: "PUT",
      headers: { 
        "Content-Type":"application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if(res.ok){
      alert("Profile saved successfully!");
      updateProfileCompletion();
      updatePreview();
    } else {
      alert(data.message || "Error saving profile.");
    }
  } catch(err){
    console.error(err);
    alert("Network error. Try again later.");
  }
}

// ==================== Profile completion bar ====================
function updateProfileCompletion(){
  let completed = logo.src && logo.src !== "https://cdn-icons-png.flaticon.com/512/732/732200.png" ? 1 : 0;
  fields.forEach(id => { if(document.getElementById(id).value.trim() !== "") completed++; });
  const percent = Math.round((completed/(fields.length+1))*100);
  const bar = document.getElementById("profileCompletion");
  bar.style.width = percent + "%";
  bar.textContent = percent + "%";
}

// ==================== Update preview section ====================
function updatePreview(){
  document.getElementById("companyNamePreview").textContent = document.getElementById("companyName").value || '';
  document.getElementById("descriptionPreview").textContent = document.getElementById("description").value || '';
  document.getElementById("contactEmailPreview").textContent = document.getElementById("companyEmail").value || '';
}

// ==================== Logo upload ====================
logo.addEventListener("click", ()=>document.getElementById("logoUpload").click());
document.getElementById("logoUpload").addEventListener("change", e=>{
  const file = e.target.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = ()=>{ logo.src = reader.result; updateProfileCompletion(); };
    reader.readAsDataURL(file);
  }
});

// ==================== Input changes ====================
fields.forEach(id => document.getElementById(id).addEventListener("input", ()=>{
  updateProfileCompletion();
  updatePreview();
}));

// ==================== Save button ====================
saveBtn.addEventListener("click", saveProfile);

// ==================== Load profile on page load ====================
document.addEventListener("DOMContentLoaded", () => {
  loadProfile(); // Existing logic

  // ==================== New fetch for debugging/logging ====================
  fetch("/api/employer/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Employer Profile (from /api/employer/profile):", data);
      // Optional: display in separate HTML elements if needed
      if(document.getElementById("employerName")) document.getElementById("employerName").textContent = data.name;
      if(document.getElementById("employerEmail")) document.getElementById("employerEmail").textContent = data.email;
    })
    .catch((err) => console.error("Error fetching profile:", err));
});

