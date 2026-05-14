    // Resume Builder
    function generateResume() {
      const name = document.getElementById("rbName").value;
      const email = document.getElementById("rbEmail").value;
      const skills = document.getElementById("rbSkills").value;
      const exp = document.getElementById("rbExp").value;

      document.getElementById("resumePreview").innerHTML = `
        <h3>${name}</h3>
        <p><b>Email:</b> ${email}</p>
        <p><b>Skills:</b> ${skills}</p>
        <p><b>Experience:</b> ${exp}</p>
      `;
    }

    // Resume Analyser (mock ATS analysis)
    function analyseResume() {
      const file = document.getElementById("resumeFile").files[0];
      if (!file) return;

      let feedback = `
        <p><b>File:</b> ${file.name}</p>
        <p><b>Strengths:</b> Clear formatting, good readability.</p>
        <p><b>Suggestions:</b> Add measurable achievements, include keywords for ATS.</p>
        <p><b>ATS Score:</b> ${Math.floor(Math.random()*21)+80}% ✅</p>
      `;
      document.getElementById("analysisResult").innerHTML = `<h3>Analysis Result</h3>${feedback}`;
    }
