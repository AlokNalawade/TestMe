/* // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics"; */
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCO0Div6RgFAvEiJF-dvmgCeqx5rgkyj1E",
  authDomain: "testme-777.firebaseapp.com",
  projectId: "testme-777",
  storageBucket: "testme-777.firebasestorage.app",
  messagingSenderId: "818428755898",
  appId: "1:818428755898:web:cc94d231a770f846bee783",
  measurementId: "G-EJJD6JDDN5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


// TestMe App - Vanilla JS + Firebase (free tier)
/* // Replace firebaseConfig below with your own Firebase project config.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // Optional: add other values like storageBucket, messagingSenderId, appId if needed
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore(); */

// Simple role handling: emails listed here will be treated as admins.
// You can remove this and instead store role in the Firestore users collection if preferred.
const ADMIN_EMAILS = ["alok572@gmail.com"];

const state = {
  user: null,
  isAdmin: false,
  currentView: "auth", // "auth" | "admin-dashboard" | "student-dashboard" | "take-test" | "view-attempt"
  tests: [],
  questions: [],
  selectedTest: null,
  selectedAttempt: null,
  attempts: [],
  loading: false,
  error: "",
  info: "",
  activeAuthTab: "login", // "login" | "register"
  activeAdminTab: "questions", // "questions" | "tests" | "results"
  currentTestState: null, // { testId, questions, answers, startTime, timeLimitMinutes }
};

const appRoot = document.getElementById("app-root");

function setState(patch) {
  Object.assign(state, patch);
  render();
}

function setLoading(loading, message) {
  setState({
    loading,
    error: loading ? "" : state.error,
    info: loading && message ? message : state.info,
  });
}

function showError(message) {
  setState({ error: message, info: "" });
}

function showInfo(message) {
  setState({ info: message, error: "" });
}

// ---------- Rendering ----------

function render() {
  if (!appRoot) return;
  appRoot.innerHTML = "";

  const shell = document.createElement("div");
  shell.className = "app-shell";

  shell.appendChild(renderHeader());

  const main = document.createElement("main");
  main.className = "app-main";

  if (state.currentView === "auth") {
    main.appendChild(renderAuthCard());
  } else if (state.currentView === "admin-dashboard") {
    main.appendChild(renderAdminDashboard());
  } else if (state.currentView === "student-dashboard") {
    main.appendChild(renderStudentDashboard());
  } else if (state.currentView === "take-test") {
    main.appendChild(renderTestTaking());
  } else if (state.currentView === "view-attempt") {
    main.appendChild(renderAttemptDetail());
  }

  shell.appendChild(main);
  appRoot.appendChild(shell);
}

function renderHeader() {
  const header = document.createElement("header");
  header.className = "app-header";

  const title = document.createElement("div");
  title.className = "app-header-title";
  title.textContent = "Kangaroo Math Test App";
  header.appendChild(title);

  const actions = document.createElement("div");
  actions.className = "app-header-actions";

  if (state.user) {
    const userLabel = document.createElement("span");
    userLabel.className = "text-sm";
    userLabel.textContent = `${state.user.email} ${state.isAdmin ? "(Admin)" : ""}`;
    actions.appendChild(userLabel);

    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "Logout";
    logoutBtn.onclick = () => auth.signOut();
    actions.appendChild(logoutBtn);
  }

  header.appendChild(actions);
  return header;
}

function renderAuthCard() {
  const card = document.createElement("div");
  card.className = "card";

  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = "Welcome to Kangaroo Math Practice";
  header.appendChild(title);

  const tabs = document.createElement("div");
  tabs.className = "tabs";

  const loginTab = document.createElement("button");
  loginTab.className = "tab" + (state.activeAuthTab === "login" ? " active" : "");
  loginTab.textContent = "Login";
  loginTab.onclick = () => setState({ activeAuthTab: "login", error: "", info: "" });

  const registerTab = document.createElement("button");
  registerTab.className = "tab" + (state.activeAuthTab === "register" ? " active" : "");
  registerTab.textContent = "Register";
  registerTab.onclick = () => setState({ activeAuthTab: "register", error: "", info: "" });

  tabs.appendChild(loginTab);
  tabs.appendChild(registerTab);
  header.appendChild(tabs);
  card.appendChild(header);

  if (state.error) {
    const err = document.createElement("div");
    err.className = "error-text mt-1";
    err.textContent = state.error;
    card.appendChild(err);
  }

  if (state.info) {
    const info = document.createElement("div");
    info.className = "success-text mt-1";
    info.textContent = state.info;
    card.appendChild(info);
  }

  card.appendChild(state.activeAuthTab === "login" ? renderLoginForm() : renderRegisterForm());

  const note = document.createElement("p");
  note.className = "text-xs mt-3";
  note.textContent =
    "Tip: Any email listed in ADMIN_EMAILS in app.js will see the admin dashboard.";
  card.appendChild(note);

  return card;
}

function renderLoginForm() {
  const container = document.createElement("div");
  container.className = "form-grid";

  const emailField = createInputField("Email", "email", "email");
  const passwordField = createInputField("Password", "password", "password");

  container.appendChild(emailField.field);
  container.appendChild(passwordField.field);

  const actions = document.createElement("div");
  actions.className = "mt-3";

  const btn = document.createElement("button");
  btn.className = "btn btn-primary";
  btn.textContent = state.loading ? "Signing in..." : "Sign in";
  btn.disabled = state.loading;
  btn.onclick = () =>
    handleLogin(emailField.input.value.trim(), passwordField.input.value.trim());

  actions.appendChild(btn);
  container.appendChild(actions);

  return container;
}

function renderRegisterForm() {
  const container = document.createElement("div");
  container.className = "form-grid";

  const nameField = createInputField("Full name", "text", "name");
  const levelField = createSelectField("Kangaroo level", "level", [
    "",
    "Pre-Ecolier",
    "Ecolier",
    "Benjamin",
    "Cadet",
    "Junior",
    "Student",
  ]);
  const emailField = createInputField("Email", "email", "email");
  const passwordField = createInputField("Password (min 6 chars)", "password", "password");

  container.appendChild(nameField.field);
  container.appendChild(levelField.field);
  container.appendChild(emailField.field);
  container.appendChild(passwordField.field);

  const actions = document.createElement("div");
  actions.className = "mt-3";

  const btn = document.createElement("button");
  btn.className = "btn btn-primary";
  btn.textContent = state.loading ? "Creating account..." : "Create account";
  btn.disabled = state.loading;
  btn.onclick = () =>
    handleRegister(
      nameField.input.value.trim(),
      levelField.select.value,
      emailField.input.value.trim(),
      passwordField.input.value.trim()
    );

  actions.appendChild(btn);
  container.appendChild(actions);

  return container;
}

function createInputField(labelText, type, name) {
  const field = document.createElement("div");
  field.className = "field";

  const label = document.createElement("label");
  label.textContent = labelText;

  const input = document.createElement("input");
  input.type = type;
  input.name = name;

  field.appendChild(label);
  field.appendChild(input);

  return { field, input };
}

function createSelectField(labelText, name, options) {
  const field = document.createElement("div");
  field.className = "field";

  const label = document.createElement("label");
  label.textContent = labelText;

  const select = document.createElement("select");
  select.name = name;

  options.forEach((opt) => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt || "Select...";
    select.appendChild(option);
  });

  field.appendChild(label);
  field.appendChild(select);

  return { field, select };
}

// ---------- Admin Dashboard ----------

function renderAdminDashboard() {
  const card = document.createElement("div");
  card.className = "card";

  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = "Admin Dashboard";
  header.appendChild(title);

  const tabs = document.createElement("div");
  tabs.className = "tabs";

  ["questions", "tests", "results"].forEach((tabKey) => {
    const label =
      tabKey === "questions" ? "Questions" : tabKey === "tests" ? "Tests" : "Results";
    const tab = document.createElement("button");
    tab.className = "tab" + (state.activeAdminTab === tabKey ? " active" : "");
    tab.textContent = label;
    tab.onclick = () => setState({ activeAdminTab: tabKey });
    tabs.appendChild(tab);
  });

  header.appendChild(tabs);
  card.appendChild(header);

  if (state.error) {
    const err = document.createElement("div");
    err.className = "error-text mt-1";
    err.textContent = state.error;
    card.appendChild(err);
  }

  if (state.info) {
    const info = document.createElement("div");
    info.className = "success-text mt-1";
    info.textContent = state.info;
    card.appendChild(info);
  }

  if (state.activeAdminTab === "questions") {
    card.appendChild(renderAdminQuestions());
  } else if (state.activeAdminTab === "tests") {
    card.appendChild(renderAdminTests());
  } else {
    card.appendChild(renderAdminResults());
  }

  return card;
}

function renderAdminQuestions() {
  const container = document.createElement("div");

  const subtitle = document.createElement("div");
  subtitle.className = "text-sm mt-2";
  subtitle.textContent = "Add Kangaroo-style multiple choice questions.";
  container.appendChild(subtitle);

  // New question form
  const form = document.createElement("div");
  form.className = "form-grid mt-3";

  const textField = createTextareaField("Question text");
  const topicField = createInputField("Topic (e.g. Geometry, Logic)", "text", "topic");
  const levelField = createSelectField("Level", "qlevel", [
    "",
    "Pre-Ecolier",
    "Ecolier",
    "Benjamin",
    "Cadet",
    "Junior",
    "Student",
  ]);
  const difficultyField = createSelectField(
    "Difficulty",
    "difficulty",
    ["", "Easy", "Medium", "Hard"]
  );
  const pointsField = createInputField("Points", "number", "points");
  pointsField.input.min = "1";
  pointsField.input.value = "3";

  form.appendChild(textField.field);
  form.appendChild(topicField.field);
  form.appendChild(levelField.field);
  form.appendChild(difficultyField.field);
  form.appendChild(pointsField.field);

  // Options
  const optionsWrapper = document.createElement("div");
  optionsWrapper.className = "field";
  const optionsLabel = document.createElement("label");
  optionsLabel.textContent = "Answer options (A–E) and correct one";
  optionsWrapper.appendChild(optionsLabel);

  const optionsGrid = document.createElement("div");
  optionsGrid.className = "question-options";
  const optionInputs = [];

  for (let i = 0; i < 5; i++) {
    const optField = document.createElement("div");
    optField.className = "option-pill";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "correctOption";
    radio.value = String(i);
    if (i === 0) radio.checked = true;

    const label = document.createElement("span");
    label.textContent = String.fromCharCode(65 + i) + ".";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Option " + String.fromCharCode(65 + i);
    input.style.flex = "1";

    optField.appendChild(radio);
    optField.appendChild(label);
    optField.appendChild(input);
    optionsGrid.appendChild(optField);

    optionInputs.push({ radio, input });
  }

  optionsWrapper.appendChild(optionsGrid);

  // Explanation
  const explanationField = createTextareaField("Explanation / solution");

  const fullFormContainer = document.createElement("div");
  fullFormContainer.appendChild(form);
  fullFormContainer.appendChild(optionsWrapper);
  fullFormContainer.appendChild(explanationField.field);

  const actions = document.createElement("div");
  actions.className = "mt-3";
  const btn = document.createElement("button");
  btn.className = "btn btn-primary";
  btn.textContent = state.loading ? "Saving question..." : "Save question";
  btn.disabled = state.loading;
  btn.onclick = () => {
    const selected = optionInputs.find((o) => o.radio.checked) || optionInputs[0];
    const correctIndex = parseInt(selected.radio.value, 10) || 0;
    handleCreateQuestion({
      text: textField.textarea.value.trim(),
      topic: topicField.input.value.trim(),
      level: levelField.select.value,
      difficulty: difficultyField.select.value,
      points: Number(pointsField.input.value || "0"),
      options: optionInputs.map((o) => o.input.value.trim()),
      correctOptionIndex: correctIndex,
      explanation: explanationField.textarea.value.trim(),
    });
  };
  actions.appendChild(btn);
  fullFormContainer.appendChild(actions);

  container.appendChild(fullFormContainer);

  // Existing questions list
  const listTitle = document.createElement("div");
  listTitle.className = "text-sm mt-4";
  listTitle.textContent = "Existing questions";
  container.appendChild(listTitle);

  const list = document.createElement("div");
  list.className = "list mt-2";

  if (!state.questions.length) {
    const empty = document.createElement("div");
    empty.className = "list-row";
    empty.textContent = "No questions yet.";
    list.appendChild(empty);
  } else {
    state.questions.forEach((q) => {
      const row = document.createElement("div");
      row.className = "list-row";

      const main = document.createElement("div");
      main.className = "list-row-main";

      const title = document.createElement("div");
      title.className = "text-sm";
      title.textContent = q.text.length > 80 ? q.text.slice(0, 77) + "..." : q.text;

      const meta = document.createElement("div");
      meta.className = "text-xs";
      meta.textContent = `${q.topic || "General"} · ${q.level || "Any"} · ${
        q.difficulty || "Medium"
      } · ${q.points || 0} pts`;

      main.appendChild(title);
      main.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "list-row-actions";

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger text-xs";
      delBtn.textContent = "Delete";
      delBtn.onclick = () => {
        if (confirm("Delete this question?")) {
          handleDeleteQuestion(q.id);
        }
      };

      actions.appendChild(delBtn);

      row.appendChild(main);
      row.appendChild(actions);
      list.appendChild(row);
    });
  }

  container.appendChild(list);

  return container;
}

function createTextareaField(labelText) {
  const field = document.createElement("div");
  field.className = "field";

  const label = document.createElement("label");
  label.textContent = labelText;

  const textarea = document.createElement("textarea");

  field.appendChild(label);
  field.appendChild(textarea);

  return { field, textarea };
}

function renderAdminTests() {
  const container = document.createElement("div");

  const subtitle = document.createElement("div");
  subtitle.className = "text-sm mt-2";
  subtitle.textContent = "Create tests and assign existing questions.";
  container.appendChild(subtitle);

  const form = document.createElement("div");
  form.className = "form-grid mt-3";

  const nameField = createInputField("Test name", "text", "tname");
  const descField = createTextareaField("Description");
  const levelField = createSelectField("Level", "tlevel", [
    "",
    "Pre-Ecolier",
    "Ecolier",
    "Benjamin",
    "Cadet",
    "Junior",
    "Student",
  ]);
  const timeField = createInputField("Time limit (minutes)", "number", "time");
  timeField.input.min = "0";
  timeField.input.placeholder = "0 = no time limit";

  form.appendChild(nameField.field);
  form.appendChild(levelField.field);
  form.appendChild(timeField.field);
  form.appendChild(descField.field);

  const questionsSelector = document.createElement("div");
  questionsSelector.className = "mt-3";

  const qLabel = document.createElement("div");
  qLabel.className = "text-sm";
  qLabel.textContent = "Select questions for this test";
  questionsSelector.appendChild(qLabel);

  const selectedQuestionIds = new Set();

  const list = document.createElement("div");
  list.className = "list mt-2";

  state.questions.forEach((q) => {
    const row = document.createElement("div");
    row.className = "list-row";

    const main = document.createElement("div");
    main.className = "list-row-main";
    const title = document.createElement("div");
    title.className = "text-sm";
    title.textContent = q.text.length > 80 ? q.text.slice(0, 77) + "..." : q.text;
    const meta = document.createElement("div");
    meta.className = "text-xs";
    meta.textContent = `${q.topic || "General"} · ${q.level || "Any"} · ${
      q.points || 0
    } pts`;
    main.appendChild(title);
    main.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "list-row-actions";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.onchange = () => {
      if (checkbox.checked) selectedQuestionIds.add(q.id);
      else selectedQuestionIds.delete(q.id);
    };

    actions.appendChild(checkbox);
    row.appendChild(main);
    row.appendChild(actions);
    list.appendChild(row);
  });

  questionsSelector.appendChild(list);

  const actions = document.createElement("div");
  actions.className = "mt-3";
  const btn = document.createElement("button");
  btn.className = "btn btn-primary";
  btn.textContent = state.loading ? "Saving test..." : "Save test";
  btn.disabled = state.loading;
  btn.onclick = () =>
    handleCreateTest({
      name: nameField.input.value.trim(),
      description: descField.textarea.value.trim(),
      level: levelField.select.value,
      timeLimitMinutes: Number(timeField.input.value || "0"),
      questionIds: Array.from(selectedQuestionIds),
    });

  actions.appendChild(btn);

  container.appendChild(form);
  container.appendChild(questionsSelector);
  container.appendChild(actions);

  // Existing tests
  const listTitle = document.createElement("div");
  listTitle.className = "text-sm mt-4";
  listTitle.textContent = "Existing tests";
  container.appendChild(listTitle);

  const testsList = document.createElement("div");
  testsList.className = "list mt-2";

  if (!state.tests.length) {
    const empty = document.createElement("div");
    empty.className = "list-row";
    empty.textContent = "No tests yet.";
    testsList.appendChild(empty);
  } else {
    state.tests.forEach((t) => {
      const row = document.createElement("div");
      row.className = "list-row";

      const main = document.createElement("div");
      main.className = "list-row-main";

      const title = document.createElement("div");
      title.className = "text-sm";
      title.textContent = t.name;

      const meta = document.createElement("div");
      meta.className = "text-xs";
      const qCount = t.questionIds ? t.questionIds.length : 0;
      meta.textContent = `${t.level || "Any level"} · ${qCount} questions · ${
        t.timeLimitMinutes ? t.timeLimitMinutes + " min" : "No time limit"
      }`;

      main.appendChild(title);
      main.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "list-row-actions";

      const badge = document.createElement("span");
      badge.className =
        "badge " + (t.isActive ? "badge-success" : "badge-warning");
      badge.textContent = t.isActive ? "Active" : "Inactive";

      const toggleBtn = document.createElement("button");
      toggleBtn.className = "btn btn-secondary text-xs";
      toggleBtn.textContent = t.isActive ? "Deactivate" : "Activate";
      toggleBtn.onclick = () => handleToggleTestActive(t.id, !t.isActive);

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger text-xs";
      delBtn.textContent = "Delete";
      delBtn.onclick = () => {
        if (confirm("Delete this test?")) {
          handleDeleteTest(t.id);
        }
      };

      actions.appendChild(badge);
      actions.appendChild(toggleBtn);
      actions.appendChild(delBtn);

      row.appendChild(main);
      row.appendChild(actions);

      testsList.appendChild(row);
    });
  }

  container.appendChild(testsList);

  return container;
}

function renderAdminResults() {
  const container = document.createElement("div");

  const subtitle = document.createElement("div");
  subtitle.className = "text-sm mt-2";
  subtitle.textContent = "View test attempts and basic statistics.";
  container.appendChild(subtitle);

  const list = document.createElement("div");
  list.className = "list mt-3";

  if (!state.attempts.length) {
    const empty = document.createElement("div");
    empty.className = "list-row";
    empty.textContent = "No attempts yet.";
    list.appendChild(empty);
  } else {
    state.attempts.forEach((a) => {
      const row = document.createElement("div");
      row.className = "list-row";

      const main = document.createElement("div");
      main.className = "list-row-main";

      const testName = state.tests.find((t) => t.id === a.testId)?.name || "Test";
      const userEmail = a.userEmail || a.userId;

      const title = document.createElement("div");
      title.className = "text-sm";
      title.textContent = `${userEmail} · ${testName}`;

      const meta = document.createElement("div");
      meta.className = "text-xs";
      meta.textContent = `Score: ${a.score}/${a.maxScore} · Correct: ${a.correctCount} · Incorrect: ${a.incorrectCount} · Unanswered: ${a.unansweredCount}`;

      main.appendChild(title);
      main.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "list-row-actions";

      const viewLink = document.createElement("button");
      viewLink.className = "btn btn-secondary text-xs";
      viewLink.textContent = "View details";
      viewLink.onclick = () => {
        setState({
          currentView: "view-attempt",
          selectedAttempt: a,
        });
      };

      actions.appendChild(viewLink);
      row.appendChild(main);
      row.appendChild(actions);
      list.appendChild(row);
    });
  }

  container.appendChild(list);
  return container;
}

// ---------- Student Dashboard ----------

function renderStudentDashboard() {
  const card = document.createElement("div");
  card.className = "card";

  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = "Available Tests";
  header.appendChild(title);

  card.appendChild(header);

  if (state.error) {
    const err = document.createElement("div");
    err.className = "error-text mt-1";
    err.textContent = state.error;
    card.appendChild(err);
  }

  if (state.info) {
    const info = document.createElement("div");
    info.className = "success-text mt-1";
    info.textContent = state.info;
    card.appendChild(info);
  }

  const testsList = document.createElement("div");
  testsList.className = "list mt-3";

  const activeTests = state.tests.filter((t) => t.isActive);

  if (!activeTests.length) {
    const empty = document.createElement("div");
    empty.className = "list-row";
    empty.textContent = "No active tests yet.";
    testsList.appendChild(empty);
  } else {
    activeTests.forEach((t) => {
      const row = document.createElement("div");
      row.className = "list-row";

      const main = document.createElement("div");
      main.className = "list-row-main";

      const title = document.createElement("div");
      title.className = "text-sm";
      title.textContent = t.name;

      const meta = document.createElement("div");
      meta.className = "text-xs";
      const qCount = t.questionIds ? t.questionIds.length : 0;
      meta.textContent = `${t.level || "Any level"} · ${qCount} questions · ${
        t.timeLimitMinutes ? t.timeLimitMinutes + " min" : "No time limit"
      }`;

      const desc = document.createElement("div");
      desc.className = "text-xs";
      desc.textContent = t.description || "";

      main.appendChild(title);
      main.appendChild(meta);
      main.appendChild(desc);

      const actions = document.createElement("div");
      actions.className = "list-row-actions";

      const btn = document.createElement("button");
      btn.className = "btn btn-primary text-xs";
      btn.textContent = "Start test";
      btn.onclick = () => startTest(t);

      actions.appendChild(btn);

      row.appendChild(main);
      row.appendChild(actions);
      testsList.appendChild(row);
    });
  }

  card.appendChild(testsList);

  const resultsTitle = document.createElement("div");
  resultsTitle.className = "text-sm mt-4";
  resultsTitle.textContent = "My recent results";
  card.appendChild(resultsTitle);

  const resultsGrid = document.createElement("div");
  resultsGrid.className = "results-grid";

  const myAttempts = state.attempts.filter(
    (a) => a.userId === (state.user && state.user.uid)
  );

  if (!myAttempts.length) {
    const empty = document.createElement("div");
    empty.className = "text-xs mt-1";
    empty.textContent = "No attempts yet.";
    card.appendChild(empty);
  } else {
    myAttempts.forEach((a) => {
      const resultCard = document.createElement("div");
      resultCard.className = "results-card";

      const testName = state.tests.find((t) => t.id === a.testId)?.name || "Test";

      const name = document.createElement("div");
      name.className = "text-sm";
      name.textContent = testName;

      const score = document.createElement("div");
      score.className = "text-xs mt-1";
      score.textContent = `Score: ${a.score}/${a.maxScore}`;

      const meta = document.createElement("div");
      meta.className = "text-xs";
      meta.textContent = `Correct: ${a.correctCount} · Incorrect: ${a.incorrectCount} · Unanswered: ${a.unansweredCount}`;

      const link = document.createElement("div");
      link.className = "link mt-1";
      link.textContent = "View detailed review";
      link.onclick = () =>
        setState({
          currentView: "view-attempt",
          selectedAttempt: a,
        });

      resultCard.appendChild(name);
      resultCard.appendChild(score);
      resultCard.appendChild(meta);
      resultCard.appendChild(link);

      resultsGrid.appendChild(resultCard);
    });

    card.appendChild(resultsGrid);
  }

  return card;
}

// ---------- Test Taking ----------

function renderTestTaking() {
  const card = document.createElement("div");
  card.className = "card";

  if (!state.currentTestState) {
    const msg = document.createElement("div");
    msg.textContent = "No active test.";
    card.appendChild(msg);
    return card;
  }

  const test = state.selectedTest;
  const testState = state.currentTestState;

  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = test ? test.name : "Test";
  header.appendChild(title);

  if (test && test.timeLimitMinutes) {
    const timer = document.createElement("div");
    timer.className = "timer-pill";
    const remaining = getRemainingSeconds();
    const mins = Math.max(0, Math.floor(remaining / 60));
    const secs = Math.max(0, remaining % 60);
    timer.textContent = `Time left: ${mins}:${secs.toString().padStart(2, "0")}`;
    header.appendChild(timer);
  }

  card.appendChild(header);

  const questions = testState.questions;
  const answers = testState.answers || {};

  questions.forEach((q, idx) => {
    const qBlock = document.createElement("div");
    qBlock.className = "test-question";

    const qTitle = document.createElement("div");
    qTitle.className = "text-sm";
    qTitle.textContent = `Q${idx + 1}. ${q.text}`;

    const meta = document.createElement("div");
    meta.className = "text-xs mt-1";
    meta.textContent = `${q.topic || "General"} · ${q.level || "Any"} · ${
      q.points || 0
    } pts`;

    qBlock.appendChild(qTitle);
    qBlock.appendChild(meta);

    const optionsList = document.createElement("div");
    optionsList.className = "test-options";

    (q.options || []).forEach((optText, optIndex) => {
      const label = document.createElement("label");
      label.className = "test-option-label";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "q-" + q.id;
      input.value = String(optIndex);
      input.checked = answers[q.id] === optIndex;
      input.onchange = () => handleSelectAnswer(q.id, optIndex);

      const text = document.createElement("div");
      text.className = "text-sm";
      text.textContent = String.fromCharCode(65 + optIndex) + ". " + optText;

      label.appendChild(input);
      label.appendChild(text);
      optionsList.appendChild(label);
    });

    qBlock.appendChild(optionsList);
    card.appendChild(qBlock);
  });

  const actions = document.createElement("div");
  actions.className = "mt-3";

  const submitBtn = document.createElement("button");
  submitBtn.className = "btn btn-primary";
  submitBtn.textContent = state.loading ? "Submitting..." : "Submit test";
  submitBtn.disabled = state.loading;
  submitBtn.onclick = () => {
    if (confirm("Submit your answers? You won't be able to change them after.")) {
      submitTest();
    }
  };

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn btn-secondary";
  cancelBtn.textContent = "Back to dashboard";
  cancelBtn.style.marginLeft = "0.5rem";
  cancelBtn.onclick = () =>
    setState({ currentView: "student-dashboard", currentTestState: null });

  actions.appendChild(submitBtn);
  actions.appendChild(cancelBtn);

  card.appendChild(actions);

  return card;
}

function getRemainingSeconds() {
  if (!state.currentTestState || !state.selectedTest) return 0;
  if (!state.selectedTest.timeLimitMinutes) return Number.MAX_SAFE_INTEGER;
  const limitMs = state.selectedTest.timeLimitMinutes * 60 * 1000;
  const elapsed = Date.now() - state.currentTestState.startTime;
  return Math.max(0, Math.floor((limitMs - elapsed) / 1000));
}

// ---------- Attempt Detail (Review) ----------

function renderAttemptDetail() {
  const card = document.createElement("div");
  card.className = "card";

  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = "Attempt review";
  header.appendChild(title);

  const backBtn = document.createElement("button");
  backBtn.className = "btn btn-secondary text-xs";
  backBtn.textContent = "Back";
  backBtn.onclick = () => {
    if (state.isAdmin) {
      setState({ currentView: "admin-dashboard" });
    } else {
      setState({ currentView: "student-dashboard" });
    }
  };
  header.appendChild(backBtn);

  card.appendChild(header);

  if (!state.selectedAttempt) {
    const msg = document.createElement("div");
    msg.textContent = "No attempt selected.";
    card.appendChild(msg);
    return card;
  }

  const attempt = state.selectedAttempt;
  const test = state.tests.find((t) => t.id === attempt.testId);

  const summary = document.createElement("div");
  summary.className = "text-sm mt-2";
  summary.textContent = `Score: ${attempt.score}/${attempt.maxScore} · Correct: ${attempt.correctCount} · Incorrect: ${attempt.incorrectCount} · Unanswered: ${attempt.unansweredCount}`;
  card.appendChild(summary);

  const questions = attempt.questions || [];
  const answers = attempt.answers || {};

  questions.forEach((q, idx) => {
    const block = document.createElement("div");
    block.className = "test-question";

    const titleEl = document.createElement("div");
    titleEl.className = "text-sm";
    titleEl.textContent = `Q${idx + 1}. ${q.text}`;

    const meta = document.createElement("div");
    meta.className = "text-xs mt-1";
    meta.textContent = `${q.topic || "General"} · ${q.level || "Any"} · ${
      q.points || 0
    } pts`;

    block.appendChild(titleEl);
    block.appendChild(meta);

    const studentIndex = answers[q.id];
    const correctIndex = q.correctOptionIndex;

    (q.options || []).forEach((optText, optIndex) => {
      const row = document.createElement("div");
      row.className = "text-xs mt-1";

      const prefix = document.createElement("span");
      const letter = String.fromCharCode(65 + optIndex);
      prefix.textContent = `${letter}. `;

      const text = document.createElement("span");
      text.textContent = optText;

      if (optIndex === correctIndex) {
        text.style.fontWeight = "600";
        text.style.color = "#166534";
      }

      if (optIndex === studentIndex && optIndex !== correctIndex) {
        text.style.fontWeight = "600";
        text.style.color = "#b91c1c";
      }

      row.appendChild(prefix);
      row.appendChild(text);
      block.appendChild(row);
    });

    const explanation = document.createElement("div");
    explanation.className = "text-xs mt-2";
    explanation.textContent = "Explanation: " + (q.explanation || "Not provided");

    block.appendChild(explanation);
    card.appendChild(block);
  });

  return card;
}

// ---------- Auth Handlers ----------

async function handleLogin(email, password) {
  if (!email || !password) {
    showError("Please fill in email and password.");
    return;
  }
  try {
    setLoading(true, "Signing in...");
    await auth.signInWithEmailAndPassword(email, password);
    showInfo("Signed in successfully.");
  } catch (err) {
    console.error(err);
    showError(err.message || "Failed to sign in.");
  } finally {
    setLoading(false);
  }
}

async function handleRegister(name, level, email, password) {
  if (!name || !email || !password) {
    showError("Please fill in name, email and password.");
    return;
  }
  try {
    setLoading(true, "Creating account...");
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const user = cred.user;
    await db.collection("users").doc(user.uid).set({
      name,
      level: level || null,
      email,
      role: ADMIN_EMAILS.includes(email) ? "admin" : "student",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    showInfo("Account created. You are now signed in.");
  } catch (err) {
    console.error(err);
    showError(err.message || "Failed to create account.");
  } finally {
    setLoading(false);
  }
}

// ---------- Admin Firestore Handlers ----------

async function handleCreateQuestion(payload) {
  const {
    text,
    topic,
    level,
    difficulty,
    points,
    options,
    correctOptionIndex,
    explanation,
  } = payload;

  if (!text || !options.filter((o) => o).length) {
    showError("Please fill question text and at least one option.");
    return;
  }

  try {
    setLoading(true, "Saving question...");
    const docRef = await db.collection("questions").add({
      text,
      topic: topic || null,
      level: level || null,
      difficulty: difficulty || "Medium",
      points: points || 0,
      options,
      correctOptionIndex: Number.isInteger(correctOptionIndex)
        ? correctOptionIndex
        : 0,
      explanation: explanation || "",
      createdBy: state.user ? state.user.uid : null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    showInfo("Question saved.");
    await loadQuestions();
  } catch (err) {
    console.error(err);
    showError(err.message || "Failed to save question.");
  } finally {
    setLoading(false);
  }
}

async function handleDeleteQuestion(id) {
  try {
    setLoading(true, "Deleting question...");
    await db.collection("questions").doc(id).delete();
    showInfo("Question deleted.");
    await loadQuestions();
  } catch (err) {
    console.error(err);
    showError(err.message || "Failed to delete question.");
  } finally {
    setLoading(false);
  }
}

async function handleCreateTest(payload) {
  const { name, description, level, timeLimitMinutes, questionIds } = payload;

  if (!name || !questionIds.length) {
    showError("Please provide a test name and select at least one question.");
    return;
  }

  try {
    setLoading(true, "Saving test...");
    await db.collection("tests").add({
      name,
      description: description || "",
      level: level || null,
      timeLimitMinutes: timeLimitMinutes || 0,
      questionIds,
      isActive: false,
      createdBy: state.user ? state.user.uid : null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    showInfo("Test saved.");
    await loadTests();
  } catch (err) {
    console.error(err);
    showError(err.message || "Failed to save test.");
  } finally {
    setLoading(false);
  }
}

async function handleToggleTestActive(testId, isActive) {
  try {
    setLoading(true, isActive ? "Activating test..." : "Deactivating test...");
    await db.collection("tests").doc(testId).update({ isActive });
    await loadTests();
    setLoading(false);
  } catch (err) {
    console.error(err);
    showError(err.message || "Failed to update test state.");
    setLoading(false);
  }
}

async function handleDeleteTest(testId) {
  try {
    setLoading(true, "Deleting test...");
    await db.collection("tests").doc(testId).delete();
    showInfo("Test deleted.");
    await loadTests();
  } catch (err) {
    console.error(err);
    showError(err.message || "Failed to delete test.");
  } finally {
    setLoading(false);
  }
}

// ---------- Student Test Flow ----------

async function startTest(test) {
  try {
    setLoading(true, "Preparing test...");
    // Load questions referenced by this test
    const qIds = test.questionIds || [];
    if (!qIds.length) {
      showError("This test has no questions.");
      setLoading(false);
      return;
    }

    const snapshot = await db
      .collection("questions")
      .where(firebase.firestore.FieldPath.documentId(), "in", qIds.slice(0, 10))
      .get();

    const questions = [];
    snapshot.forEach((doc) => {
      questions.push({ id: doc.id, ...doc.data() });
    });

    // Note: Firestore "in" queries support up to 10 values; for more questions
    // you could fetch in batches. For a simple practice app, 10 is usually enough.

    const testState = {
      testId: test.id,
      questions,
      answers: {},
      startTime: Date.now(),
      timeLimitMinutes: test.timeLimitMinutes || 0,
    };

    setState({
      selectedTest: test,
      currentTestState: testState,
      currentView: "take-test",
      error: "",
      info: "",
    });

    if (test.timeLimitMinutes) {
      startTimer();
    }
  } catch (err) {
    console.error(err);
    showError(err.message || "Failed to start test.");
  } finally {
    setLoading(false);
  }
}

function handleSelectAnswer(questionId, optionIndex) {
  const testState = state.currentTestState;
  if (!testState) return;
  const answers = { ...(testState.answers || {}) };
  answers[questionId] = optionIndex;
  setState({
    currentTestState: {
      ...testState,
      answers,
    },
  });
}

async function submitTest() {
  const testState = state.currentTestState;
  const test = state.selectedTest;
  const user = state.user;

  if (!testState || !test || !user) return;

  try {
    setLoading(true, "Submitting test...");

    const questions = testState.questions;
    const answers = testState.answers || {};

    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    questions.forEach((q) => {
      const pts = q.points || 0;
      maxScore += pts;
      const given = answers[q.id];
      if (given === undefined || given === null) {
        unansweredCount++;
      } else if (given === q.correctOptionIndex) {
        correctCount++;
        score += pts;
      } else {
        incorrectCount++;
      }
    });

    const attemptDoc = {
      testId: test.id,
      userId: user.uid,
      userEmail: user.email,
      questions: questions.map((q) => ({
        id: q.id,
        text: q.text,
        topic: q.topic || null,
        level: q.level || null,
        points: q.points || 0,
        options: q.options || [],
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation || "",
      })),
      answers,
      score,
      maxScore,
      correctCount,
      incorrectCount,
      unansweredCount,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("attempts").add(attemptDoc);

    showInfo("Test submitted. Here are your results.");

    setState({
      currentTestState: null,
      currentView: "view-attempt",
      selectedAttempt: {
        ...attemptDoc,
        id: "local",
      },
    });

    // Refresh attempts list for dashboards
    await loadAttempts();
  } catch (err) {
    console.error(err);
    showError(err.message || "Failed to submit test.");
  } finally {
    setLoading(false);
  }
}

function startTimer() {
  if (!state.selectedTest || !state.selectedTest.timeLimitMinutes) return;
  const interval = setInterval(() => {
    const remaining = getRemainingSeconds();
    if (remaining <= 0) {
      clearInterval(interval);
      alert("Time is up! Your test will be submitted.");
      submitTest();
    } else {
      // Trigger re-render to update timer
      render();
    }
  }, 1000);
}

// ---------- Firestore loading ----------

async function loadQuestions() {
  const snapshot = await db
    .collection("questions")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();
  const questions = [];
  snapshot.forEach((doc) => {
    questions.push({ id: doc.id, ...doc.data() });
  });
  setState({ questions });
}

async function loadTests() {
  const snapshot = await db
    .collection("tests")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  const tests = [];
  snapshot.forEach((doc) => {
    tests.push({ id: doc.id, ...doc.data() });
  });
  setState({ tests });
}

async function loadAttempts() {
  const snapshot = await db
    .collection("attempts")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();
  const attempts = [];
  snapshot.forEach((doc) => {
    attempts.push({ id: doc.id, ...doc.data() });
  });
  setState({ attempts });
}

// ---------- Auth state listener ----------

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    setState({
      user: null,
      isAdmin: false,
      currentView: "auth",
      error: "",
      info: "",
    });
    return;
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email || "");

  setState({
    user,
    isAdmin,
    currentView: isAdmin ? "admin-dashboard" : "student-dashboard",
    error: "",
    info: "",
  });

  try {
    await Promise.all([loadQuestions(), loadTests(), loadAttempts()]);
  } catch (err) {
    console.error(err);
  }
});

// Initial render
render();

