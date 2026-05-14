fetch("http://localhost:5000/api/employers/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
})
  .then((res) => res.json())
  .then((data) => {
    if (data.token) {
      localStorage.setItem("employerToken", data.token); // ✅ store token here
      alert("✅ Login successful!");
      window.location.href = "employers.html"; // redirect to dashboard
    } else {
      alert("Invalid credentials");
    }
  })
  .catch((err) => console.error("Login error:", err));
