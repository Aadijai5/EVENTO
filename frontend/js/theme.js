
// ========================================
// EVENTO - THEME MANAGEMENT
// ========================================

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");


// Apply selected theme
function applyTheme(theme) {

    document.documentElement.setAttribute("data-theme", theme);

    if (themeIcon) {
        themeIcon.textContent = theme === "dark" ? "☀" : "☾";
    }

    if (themeToggle) {
        themeToggle.setAttribute(
            "aria-label",
            theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
        );
    }

    localStorage.setItem("evento-theme", theme);
}


// Load saved theme when website opens
function loadTheme() {

    const savedTheme = localStorage.getItem("evento-theme");

    const preferredTheme =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";

    const initialTheme = savedTheme || preferredTheme;

    applyTheme(initialTheme);
}


// Toggle between light and dark
function toggleTheme() {

    const currentTheme =
        document.documentElement.getAttribute("data-theme");

    const newTheme = currentTheme === "dark" ? "light" : "dark";

    applyTheme(newTheme);
}


// Theme button event
if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
}


// Initialize theme
loadTheme();
