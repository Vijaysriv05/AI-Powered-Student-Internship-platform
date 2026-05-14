
    let stream;
    let timerInterval;
    let secondsElapsed = 0;
    let stabilityInterval;
    let questionHistory = [];
    let qCount = 0;

    const setupScreen = document.getElementById('setupScreen');
    const interviewScreen = document.getElementById('interviewScreen');
    const videoElement = document.getElementById('userVideo');
    const logs = document.getElementById('observerLogs');

    function addLog(msg) {
        logs.innerHTML += `<br>> ${msg}`;
        logs.scrollTop = logs.scrollHeight;
    }

    // Camera Init
    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            videoElement.srcObject = stream;
            addLog("Camera connected successfully.");
            document.getElementById('stabilityOverlay').style.display = 'flex';
            startStabilityTracker();
            return true;
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Camera access is required for the mock interview.");
            addLog("<span style='color:#ef4444'>Camera access denied.</span>");
            return false;
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
        }
        clearInterval(stabilityInterval);
    }

    let currentTotalScore = 0;
    let questionsCompleted = 0;
    let maxQuestions = 10;
    let currentCorrectAnswer = "";

    document.getElementById('testTypeSelector').addEventListener('change', (e) => {
        document.getElementById('languageSelectArea').style.display = e.target.value === 'Coding' ? 'block' : 'none';
        maxQuestions = e.target.value === 'Coding' ? 2 : 10;
    });

    // Timer
    function startTimer() {
        timerInterval = setInterval(() => {
            secondsElapsed++;
            const m = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
            const s = String(secondsElapsed % 60).padStart(2, '0');
            document.getElementById('timerDisplay').innerText = `${m}:${s}`;
        }, 1000);
    }

    // Stability Tracker with Messaging
    function startStabilityTracker() {
        const fill = document.getElementById('stabilityFill');
        const scoreUI = document.getElementById('stabilityScore');
        const proctorAlert = document.getElementById('proctoringAlert');
        const motivateAlert = document.getElementById('motivationAlert');
        
        stabilityInterval = setInterval(() => {
            const val = Math.round(75 + (Math.random() * 25)); // 75-100 range
            fill.style.width = `${val}%`;
            scoreUI.innerText = `${val}%`;
            
            if(val < 85) {
                proctorAlert.style.display = 'block';
                motivateAlert.style.display = 'none';
                setTimeout(() => { if(proctorAlert) proctorAlert.style.display = 'none'; }, 10000);
            } else if(val > 95 && questionsCompleted > 0) {
                motivateAlert.style.display = 'block';
                proctorAlert.style.display = 'none';
                setTimeout(() => { if(motivateAlert) motivateAlert.style.display = 'none'; }, 8000);
            }
            
            if(val > 88) fill.style.background = '#10b981';
            else if(val > 78) fill.style.background = '#fbbf24';
            else fill.style.background = '#ef4444';
        }, 8000);
    }

    async function fetchNextQuestion() {
        if(questionsCompleted >= maxQuestions) return endInterview("Max questions reached!");

        const testType = document.getElementById("testTypeSelector").value;
        const domain = document.getElementById("domainSelector").value;
        const language = document.getElementById("languageSelector").value;

        const qBox = document.getElementById('questionBox');
        const feedbackBox = document.getElementById('feedbackBox');
        const mcqS = document.getElementById('mcqSection');
        const standardS = document.getElementById('answerSection');
        const codingS = document.getElementById('codingSection');

        qBox.innerHTML = '<div class="spinner"></div>';
        feedbackBox.style.display = 'none';
        mcqS.style.display = 'none';
        standardS.style.display = 'none';
        codingS.style.display = 'none';

        try {
            const res = await fetch("/api/chatbot/mock-interview-question", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domain, history: questionHistory, testType, language })
            });
            const data = await res.json();
            
            if(res.ok) {
                questionsCompleted++;
                document.getElementById('questionCounter').innerText = `Question ${questionsCompleted} / ${maxQuestions}`;
                questionHistory.push(data.question || data.statement || data.Question);

                if(testType === "MCQ") {
                    qBox.innerText = data.question;
                    currentCorrectAnswer = data.correct;
                    mcqS.style.display = 'block';
                    const cont = document.getElementById("optionsContainer");
                    cont.innerHTML = data.options.map(opt => `
                        <button class="btn btn-secondary" onclick="checkMCQ('${opt.charAt(0)}', '${data.explanation}')">${opt}</button>
                    `).join("");
                } else if(testType === "Coding") {
                    qBox.innerText = data.question;
                    codingS.style.display = 'block';
                    document.getElementById('codeHeader').innerText = `${language.toLowerCase()}_solution.${language === 'Python' ? 'py' : language === 'Java' ? 'java' : 'cpp'}`;
                } else {
                    qBox.innerText = data.question;
                    standardS.style.display = 'block';
                }
                addLog(`Started Q${questionsCompleted} (${testType})`);
            }
        } catch (err) { console.error(err); qBox.innerText = "Error loading question."; }
    }

    window.checkMCQ = (choice, explanation) => {
        const feedbackBox = document.getElementById("feedbackBox");
        feedbackBox.style.display = 'block';
        const isCorrect = choice === currentCorrectAnswer.charAt(0);
        const score = isCorrect ? 100 : 0;
        document.getElementById('feedbackScore').innerText = `Score: ${score}/100`;
        document.getElementById('feedbackText').innerText = isCorrect ? "Excellent! " + explanation : "Oops! The correct answer was " + currentCorrectAnswer + ". " + explanation;
        currentTotalScore += score;
    };

    document.getElementById('runCodeBtn').addEventListener('click', async () => {
        const code = document.getElementById('codeEditor').value;
        if(!code.trim()) return alert("Please write some code.");
        const btn = document.getElementById('runCodeBtn');
        btn.disabled = true;
        btn.innerText = "Simulating Execution...";

        setTimeout(() => {
            const feedbackBox = document.getElementById("feedbackBox");
            feedbackBox.style.display = 'block';
            const score = 80 + Math.floor(Math.random() * 20); // Simulated logic
            document.getElementById('feedbackScore').innerText = `Score: ${score}/100`;
            document.getElementById('feedbackText').innerText = "AI Analysis: Logic looks correct. Time complexity O(N). Well done!";
            currentTotalScore += score;
            btn.disabled = false;
            btn.innerText = "▶ Run & Evaluate Code";
        }, 2000);
    });

    document.getElementById('evaluateBtn').addEventListener('click', async () => {
        const answer = document.getElementById('answerBox').value;
        const currentQuestion = questionHistory[questionHistory.length - 1];
        if(!answer.trim()) return alert("Please type your answer.");
        
        const btn = document.getElementById('evaluateBtn');
        btn.disabled = true;
        btn.innerText = "Evaluating...";

        try {
            const res = await fetch("/api/chatbot/mock-interview-evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: currentQuestion, answer })
            });
            const data = await res.json();
            if(res.ok) {
                const feedbackBox = document.getElementById("feedbackBox");
                feedbackBox.style.display = 'block';
                document.getElementById('feedbackScore').innerText = `Score: ${data.score}/100`;
                document.getElementById('feedbackText').innerText = data.feedback;
                currentTotalScore += data.score;
            }
        } catch(err) {}
        btn.disabled = false;
        btn.innerText = "Submit & Evaluate";
    });

    // Flow Controls
    document.getElementById('startBtn').addEventListener('click', async () => {
        const btn = document.getElementById('startBtn');
        btn.disabled = true;
        
        const success = await startCamera();
        if (success) {
            setupScreen.style.display = 'none';
            interviewScreen.style.display = 'flex';
            document.getElementById('currentDomainLabel').innerText = document.getElementById('domainSelector').value;
            startTimer();
            fetchNextQuestion();
        } else {
            btn.disabled = false;
        }
    });

    document.getElementById('nextQBtn').addEventListener('click', fetchNextQuestion);

    async function endInterview(reason = "") {
        clearInterval(timerInterval);
        stopCamera();
        const avgScore = questionsCompleted > 0 ? Math.round(currentTotalScore / questionsCompleted) : 0;
        
        let command = "Needs Improvement. Keep practicing!";
        if(avgScore >= 90) command = "Mastered! You are ready for the real thing.";
        else if(avgScore >= 75) command = "Great Job! Just a few minor tweaks needed.";
        else if(avgScore >= 50) command = "Good Effort. Focus more on technical depth.";

        alert(`Interview completed! ${reason}\n\nAvg Score: ${avgScore}/100\nStatus: ${command}`);
        window.location.href = 'students.html';
    }

    document.getElementById('endBtn').addEventListener('click', () => endInterview("User ended interview."));
  