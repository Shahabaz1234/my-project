// ----------------- Toggle Forms -----------------
const loginFormEl = document.getElementById("loginForm");
const signupFormEl = document.getElementById("signupForm");
const loksevaPageEl = document.getElementById("loksevaPage");
const quizPageEl = document.getElementById("quizPage");

function showSection(sectionToShow, sectionToHide) {
  sectionToHide.classList.remove("show");
  setTimeout(() => {
    sectionToHide.classList.add("hidden");
    sectionToShow.classList.remove("hidden");
    setTimeout(() => sectionToShow.classList.add("show"), 20);
  }, 300);
}

document.getElementById("showSignupLink").addEventListener("click", (e) => {
  e.preventDefault();
  showSection(signupFormEl, loginFormEl);
});

document.getElementById("showLoginLink").addEventListener("click", (e) => {
  e.preventDefault();
  showSection(loginFormEl, signupFormEl);
});

// ----------------- Signup -----------------
document.getElementById("signup-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("signup-name").value.trim();
  const contact = document.getElementById("signup-contact").value.trim();
  const address = document.getElementById("signup-address").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;

  let users = JSON.parse(localStorage.getItem("users")) || [];
  if (users.some((u) => u.email === email)) {
    alert("User already exists!");
    return;
  }

  users.push({ name, contact, address, email, password });
  localStorage.setItem("users", JSON.stringify(users));

  alert("Signup successful! Please login.");
  this.reset();
  showSection(loginFormEl, signupFormEl);
});

// ----------------- Admin Add Questionnaire -----------------
document.getElementById("questionnaire-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const qnName = document.getElementById("qn-name").value.trim();
  const question = document.getElementById("qn-question").value.trim();
  const points = parseInt(document.getElementById("qn-points").value);
  const category = document.getElementById("qn-category").value.trim();
  const status = document.getElementById("qn-status").value;
  const options = document.getElementById("qn-options").value.split(",").map(o => o.trim());
  const answer = document.getElementById("qn-answer").value.trim();

  let questionnaires = JSON.parse(localStorage.getItem("questionnaires")) || [];
  questionnaires.push({ qnName, question, points, category, status, options, answer });
  localStorage.setItem("questionnaires", JSON.stringify(questionnaires));

  alert("✅ Questionnaire added successfully!");
  this.reset();
  renderQuizzes();
});

// ----------------- Login -----------------
document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const selectedRole = document.getElementById("login-role").value;
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  let users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find((u) => u.email === email && u.password === password);

  if (user || (selectedRole === "admin" && email === "admin@lokseva.com" && password === "admin123")) {
    showSection(quizPageEl, loksevaPageEl);

    document.getElementById("welcomeUser").textContent = `🎯 Welcome ${user ? user.name : "Admin"}`;

    if (selectedRole === "admin") {
      document.getElementById("adminPanel").classList.remove("hidden");
      document.getElementById("historyBtn").classList.add("hidden");
      renderQuizzes();
    } else {
      document.getElementById("adminPanel").classList.add("hidden");
      document.getElementById("historyBtn").classList.remove("hidden");
      startQuiz(user ? user.email : "admin");
    }
  } else {
    alert("Invalid login credentials!");
  }
});

// ----------------- Logout -----------------
document.getElementById("logoutBtn").addEventListener("click", function () {
  showSection(loksevaPageEl, quizPageEl);
  document.getElementById("adminPanel").classList.add("hidden");
  document.getElementById("quiz-result").classList.add("hidden");
  document.getElementById("userHistory").classList.add("hidden");
});

// ----------------- Quiz -----------------
let currentQuestion = 0;
let score = 0;
let activeQuiz = [];
let currentUserEmail = "";

function startQuiz(userEmail) {
  currentUserEmail = userEmail;

  const questionnaires = JSON.parse(localStorage.getItem("questionnaires")) || [];
  activeQuiz = questionnaires.filter(q => q.status === "active");

  if (activeQuiz.length === 0) {
    document.getElementById("quiz-question").textContent = "No active quizzes available.";
    document.getElementById("quiz-options").innerHTML = "";
    return;
  }

  currentQuestion = 0;
  score = 0;
  document.getElementById("quiz-container").classList.remove("hidden");
  document.getElementById("quiz-result").classList.add("hidden");
  loadQuestion();
}

function loadQuestion() {
  const q = activeQuiz[currentQuestion];
  document.getElementById("quiz-question").textContent = `${q.qnName}: ${q.question} (Points: ${q.points})`;
  const optionsDiv = document.getElementById("quiz-options");
  optionsDiv.innerHTML = "";
  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.className = "block w-full text-left px-4 py-2 border rounded hover:bg-blue-100 transition";
    btn.onclick = () => selectAnswer(opt, q.answer);
    optionsDiv.appendChild(btn);
  });
}

function selectAnswer(answer, correctAnswer) {
  if (answer === correctAnswer) {
    score++;
  }
  document.querySelectorAll("#quiz-options button").forEach(btn => btn.disabled = true);
}

function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < activeQuiz.length) {
    loadQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  document.getElementById("quiz-container").classList.add("hidden");
  document.getElementById("quiz-result").classList.remove("hidden");
  document.getElementById("quiz-result").textContent = `✅ You scored ${score} out of ${activeQuiz.length}`;

  let history = JSON.parse(localStorage.getItem("history")) || [];
  history.push({ user: currentUserEmail, date: new Date().toLocaleString(), score, total: activeQuiz.length });
  localStorage.setItem("history", JSON.stringify(history));
}

// ----------------- History -----------------
document.getElementById("historyBtn").addEventListener("click", function () {
  const historyDiv = document.getElementById("userHistory");
  const historyList = document.getElementById("historyList");

  let history = JSON.parse(localStorage.getItem("history")) || [];
  let userHistory = history.filter(h => h.user === currentUserEmail);

  historyList.innerHTML = "";
  if (userHistory.length === 0) {
    historyList.innerHTML = "<p>No history found.</p>";
  } else {
    userHistory.forEach(h => {
      const item = document.createElement("div");
      item.textContent = `${h.date} - Scored ${h.score}/${h.total}`;
      historyList.appendChild(item);
    });
  }

  historyDiv.classList.remove("hidden");
});

// ----------------- Admin Quiz List Rendering -----------------
function renderQuizzes() {
  let questionnaires = JSON.parse(localStorage.getItem("questionnaires")) || [];
  const quizList = document.getElementById("quizList");
  const warning = document.getElementById("noQuizWarning");

  quizList.innerHTML = "";

  if (questionnaires.length === 0) {
    warning.classList.remove("hidden");

    // Hide warning automatically after 3 seconds
    setTimeout(() => {
      warning.classList.add("hidden");
    }, 3000);
    return;
  }

  warning.classList.add("hidden");

  // Show only quiz names in the list
  questionnaires.forEach((q) => {
    const li = document.createElement("li");
    li.textContent = `📌 ${q.qnName}`;
    li.className = "p-2 bg-indigo-50 rounded shadow-sm hover:bg-indigo-100 transition";
    quizList.appendChild(li);
  });
}

// ----------------- Toggle Quiz Form -----------------
document.getElementById("showQuizFormBtn").addEventListener("click", function () {
  const form = document.getElementById("questionnaire-form");
  form.classList.toggle("hidden");
});

