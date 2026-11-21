const USERS_KEY = "floreria_users";
const SESSION_KEY = "floreria_session";

const getUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
};

const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

async function hashPassword(text) {
  const data = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function setFieldError(form, name, message) {
  const input = form.elements[name];
  const box = form.querySelector(`[data-error-for="${name}"]`);
  if (box) box.textContent = message || "";
  if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
}

function showFormError(message) {
  const box = document.getElementById("form-error");
  if (!box) return;
  box.textContent = message || "";
  box.hidden = !message;
}

function startSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }));
  window.location.href = "home.html";
}

function initRegister() {
  const form = document.getElementById("register-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showFormError("");

    const name = form.name.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    const confirm = form.confirm.value;

    setFieldError(form, "name", name ? "" : "Escribe tu nombre.");
    setFieldError(form, "email", isEmail(email) ? "" : "Correo no válido.");
    setFieldError(form, "password", password.length >= 6 ? "" : "Mínimo 6 caracteres.");
    setFieldError(form, "confirm", password === confirm ? "" : "Las contraseñas no coinciden.");

    if (form.querySelector('[aria-invalid="true"]')) return;

    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      showFormError("Ya existe una cuenta con ese correo.");
      return;
    }

    const user = { name, email, password: await hashPassword(password) };
    users.push(user);
    saveUsers(users);
    startSession(user);
  });
}

function initLogin() {
  const form = document.getElementById("login-form");
  if (!form) return;

  if (sessionStorage.getItem(SESSION_KEY)) {
    window.location.replace("home.html");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showFormError("");

    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    setFieldError(form, "email", isEmail(email) ? "" : "Correo no válido.");
    setFieldError(form, "password", password ? "" : "Escribe tu contraseña.");
    if (form.querySelector('[aria-invalid="true"]')) return;

    const hashed = await hashPassword(password);
    const user = getUsers().find((u) => u.email === email && u.password === hashed);

    if (!user) {
      showFormError("Correo o contraseña incorrectos.");
      return;
    }
    startSession(user);
  });
}

function initHome() {
  const logout = document.getElementById("logout");
  if (!logout) return;

  let session = null;
  try {
    session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {}

  if (!session) {
    window.location.replace("login.html");
    return;
  }

  document.getElementById("user-name").textContent = session.name.split(" ")[0];

  logout.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = "login.html";
  });
}

initRegister();
initLogin();
initHome();