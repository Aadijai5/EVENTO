// ============================================
// EVENTO - FRONTEND ONLY PROFILE SYSTEM
// Mock Authentication + Profile + Tickets
// ============================================

const mockEvents = window.EVENTO_EVENTS || [];

// ============================================
// DOM ELEMENTS
// ============================================

const authSection = document.getElementById("authSection");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const authMessage = document.getElementById("authMessage");
const authHeading = document.getElementById("authHeading");
const authDescription = document.getElementById("authDescription");
const authToggle = document.getElementById("authToggle");

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");

const profileTotalEvents = document.getElementById("profileTotalEvents");
const profileUpcomingEvents = document.getElementById("profileUpcomingEvents");
const profileCompletedEvents = document.getElementById("profileCompletedEvents");

const profileEventList = document.getElementById("profileEventList");
const profileTicketList = document.getElementById("profileTicketList");
const profileEmptyMessage = document.getElementById("profileEmptyMessage");

const profileImage = document.getElementById("profileImage");
const profileAvatarIcon = document.getElementById("profileAvatarIcon");

const editProfileBtn = document.getElementById("editProfileBtn");
const logoutBtn = document.getElementById("logoutBtn");

const editProfileModal = document.getElementById("editProfileModal");
const closeProfileModal = document.getElementById("closeProfileModal");
const cancelProfileEdit = document.getElementById("cancelProfileEdit");

const editProfileForm = document.getElementById("editProfileForm");
const editProfileName = document.getElementById("editProfileName");
const editProfilePhoto = document.getElementById("editProfilePhoto");

// ============================================
// GLOBAL VARIABLES
// ============================================

let isSignupMode = false;
let currentUser = null;
let selectedProfilePhoto = "";

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

function getMockUsers() {
    try {
        return JSON.parse(localStorage.getItem("evento-mock-users") || "[]");
    } catch {
        return [];
    }
}

function saveMockUsers(users) {
    localStorage.setItem("evento-mock-users", JSON.stringify(users));
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("evento-current-user"));
    } catch {
        return null;
    }
}

function getRegistrations() {
    try {
        return JSON.parse(localStorage.getItem("evento-registrations") || "[]");
    } catch {
        return [];
    }
}

function getSavedProfiles() {
    try {
        return JSON.parse(localStorage.getItem("evento-profiles") || "{}");
    } catch {
        return {};
    }
}

function saveSavedProfiles(profiles) {
    localStorage.setItem("evento-profiles", JSON.stringify(profiles));
}

// ============================================
// AUTHENTICATION MODE SWITCH
// ============================================

authToggle?.addEventListener("click", () => {
    isSignupMode = !isSignupMode;

    loginForm.hidden = isSignupMode;
    signupForm.hidden = !isSignupMode;

    authHeading.textContent = isSignupMode
        ? "Create your account"
        : "Login to your account";

    authDescription.textContent = isSignupMode
        ? "Join EVENTO and discover exciting experiences."
        : "Login to access your profile, registrations and tickets.";

    authToggle.textContent = isSignupMode
        ? "Already have an account? Login"
        : "Don't have an account? Sign up";

    authMessage.textContent = "";
});

// ============================================
// MOCK SIGNUP
// ============================================

signupForm?.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
    const password = document.getElementById("signupPassword").value;

    if (!name || !email || password.length < 8) {
        authMessage.textContent = "Please enter valid details. Password must be at least 8 characters.";
        return;
    }

    const users = getMockUsers();

    const existingUser = users.find(user => user.email === email);

    if (existingUser) {
        authMessage.textContent = "An account with this email already exists.";
        return;
    }

    users.push({
        id: Date.now(),
        name,
        email,
        password
    });

    saveMockUsers(users);

    signupForm.reset();
    authToggle.click();

    document.getElementById("loginEmail").value = email;

    authMessage.textContent =
        "Account created successfully! Please log in.";
});

// ============================================
// MOCK LOGIN
// ============================================

loginForm?.addEventListener("submit", event => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const users = getMockUsers();

    const user = users.find(item =>
        item.email === email && item.password === password
    );

    if (!user) {
        authMessage.textContent = "Incorrect email or password.";
        return;
    }

    currentUser = {
        id: user.id,
        name: user.name,
        email: user.email
    };

    localStorage.setItem(
        "evento-current-user",
        JSON.stringify(currentUser)
    );

    localStorage.setItem("evento-last-email", email);

    loginForm.reset();

    loadProfile();
});

// ============================================
// SHOW AUTHENTICATION
// ============================================

function showAuthentication() {
    if (authSection) authSection.hidden = false;

    document.querySelectorAll(".profile-email-section").forEach(section => {
        if (section.id !== "authSection") {
            section.hidden = true;
        }
    });

    document.querySelector(".profile-content")?.classList.add("logged-out");
}

// ============================================
// LOAD PROFILE
// ============================================

function loadProfile() {
    currentUser = getCurrentUser();

    if (!currentUser) {
        showAuthentication();
        return;
    }

    if (authSection) authSection.hidden = true;

    document.querySelectorAll(".profile-email-section").forEach(section => {
        if (section.id !== "authSection") {
            section.hidden = true;
        }
    });

    document.querySelector(".profile-content")?.classList.remove("logged-out");

    const profiles = getSavedProfiles();
    const savedProfile = profiles[currentUser.email] || {};

    if (profileName) {
        profileName.textContent = savedProfile.name || currentUser.name;
    }

    if (profileEmail) {
        profileEmail.textContent = currentUser.email;
    }

    if (savedProfile.photo && profileImage) {
        profileImage.src = savedProfile.photo;
        profileImage.hidden = false;

        if (profileAvatarIcon) {
            profileAvatarIcon.hidden = true;
        }
    } else {
        if (profileImage) profileImage.hidden = true;
        if (profileAvatarIcon) profileAvatarIcon.hidden = false;
    }

    renderRegistrations();
    renderTickets();
}

// ============================================
// DATE HELPERS
// ============================================

function getEventDate(event) {
    if (!event) return null;

    if (event.displayDate) {
        const date = new Date(event.displayDate);
        if (!Number.isNaN(date.getTime())) return date;
    }

    if (event.event_date) {
        const date = new Date(String(event.event_date).slice(0, 10) + "T00:00:00");
        if (!Number.isNaN(date.getTime())) return date;
    }

    return null;
}

function isUpcoming(event) {
    const date = getEventDate(event);
    if (!date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date >= today;
}

// ============================================
// GET USER REGISTRATIONS
// ============================================

function getMyRegistrations() {
    if (!currentUser) return [];

    return getRegistrations().filter(registration =>
        String(registration.email).toLowerCase() === currentUser.email.toLowerCase()
    );
}

// ============================================
// DISPLAY REGISTERED EVENTS
// ============================================

function renderRegistrations() {
    if (!profileEventList) return;

    const registrations = getMyRegistrations();

    profileEventList.innerHTML = "";

    if (profileEmptyMessage) {
        profileEmptyMessage.hidden = registrations.length > 0;
    }

    const upcoming = registrations.filter(registration => {
        const event = mockEvents.find(item =>
            Number(item.id) === Number(registration.eventId)
        );

        return isUpcoming(event);
    });

    if (profileTotalEvents) {
        profileTotalEvents.textContent = registrations.length;
    }

    if (profileUpcomingEvents) {
        profileUpcomingEvents.textContent = upcoming.length;
    }

    if (profileCompletedEvents) {
        profileCompletedEvents.textContent =
            registrations.length - upcoming.length;
    }

    registrations.forEach(registration => {
        const event = mockEvents.find(item =>
            Number(item.id) === Number(registration.eventId)
        );

        if (!event) return;

        const card = document.createElement("div");
        card.className = "profile-event-card";

        const details = document.createElement("div");

        const title = document.createElement("h3");
        title.textContent = event.title;

        const date = document.createElement("p");
        date.textContent = "📅 " + event.displayDate;

        const venue = document.createElement("p");
        venue.textContent = "📍 " + event.venue;

        const registrationId = document.createElement("p");
        registrationId.textContent =
            "Registration ID: " + registration.registrationId;

        const status = document.createElement("span");
        status.textContent = registration.checkedIn
            ? "Attended"
            : isUpcoming(event)
                ? "Upcoming"
                : "Completed";

        details.append(title, date, venue, registrationId);
        card.append(details, status);

        profileEventList.appendChild(card);
    });
}

// ============================================
// QR CODE URL
// ============================================

function getQRUrl(token, size = 180) {
    return "https://api.qrserver.com/v1/create-qr-code/" +
        `?size=${size}x${size}&data=${encodeURIComponent(token)}`;
}

// ============================================
// DISPLAY MY PASSES
// ============================================

function renderTickets() {
    if (!profileTicketList) return;

    const registrations = getMyRegistrations();
    profileTicketList.innerHTML = "";

    if (registrations.length === 0) {
        profileTicketList.innerHTML =
            "<p>You don't have any tickets yet.</p>";
        return;
    }

    registrations.forEach(registration => {
        const event = mockEvents.find(item =>
            Number(item.id) === Number(registration.eventId)
        );

        if (!event) return;

        if (!registration.qrToken) {
            registration.qrToken =
                window.crypto?.randomUUID?.() ||
                "evento-" + Date.now() + "-" + Math.random();

            const all = getRegistrations();
            const index = all.findIndex(item =>
                item.registrationId === registration.registrationId
            );

            if (index !== -1) {
                all[index].qrToken = registration.qrToken;
                localStorage.setItem(
                    "evento-registrations",
                    JSON.stringify(all)
                );
            }
        }

        const card = document.createElement("div");
        card.className = "evento-digital-pass";

        const header = document.createElement("div");
        header.className = "pass-header";
        header.innerHTML = `
            <div class="pass-brand">
                <span class="pass-logo">EVENTO<span>.</span></span>
                <small>YOUR DIGITAL EVENT PASS</small>
            </div>
            <span class="pass-status">VALID TICKET</span>
        `;

        const body = document.createElement("div");
        body.className = "pass-body";

        const details = document.createElement("div");
        details.className = "pass-details";

        const eyebrow = document.createElement("span");
        eyebrow.className = "pass-eyebrow";
        eyebrow.textContent = event.category.toUpperCase() + " EVENT";

        const title = document.createElement("h3");
        title.textContent = event.title;

        const participant = document.createElement("p");
        participant.innerHTML = "<strong>PARTICIPANT</strong>";

        const participantName = document.createElement("p");
        participantName.textContent =
            registration.name || currentUser.name;

        const date = document.createElement("p");
        date.innerHTML = "<strong>DATE & TIME</strong>";

        const dateValue = document.createElement("p");
        dateValue.textContent = event.displayDate + " · " + event.time;

        const venue = document.createElement("p");
        venue.innerHTML = "<strong>VENUE</strong>";

        const venueValue = document.createElement("p");
        venueValue.textContent = event.venue;

        const registrationId = document.createElement("p");
        registrationId.className = "pass-registration-id";
        registrationId.textContent =
            "BOOKING ID: " + registration.registrationId;

        details.append(
            eyebrow, title,
            participant, participantName,
            date, dateValue,
            venue, venueValue,
            registrationId
        );

        const qrSection = document.createElement("div");
        qrSection.className = "pass-qr-section";

        const qrImage = document.createElement("img");
        qrImage.className = "pass-qr";
        qrImage.src = getQRUrl(registration.qrToken, 220);
        qrImage.alt = "EVENTO ticket QR code";

        const qrCaption = document.createElement("p");
        qrCaption.textContent = "SCAN AT EVENT ENTRY";

        qrSection.append(qrImage, qrCaption);
        body.append(details, qrSection);

        const footer = document.createElement("div");
        footer.className = "pass-footer";

        const footerText = document.createElement("span");
        footerText.textContent = "Thank you for choosing EVENTO.";

        const downloadButton = document.createElement("button");
        downloadButton.type = "button";
        downloadButton.className = "primary-button pass-download";
        downloadButton.textContent = "↓ Download PDF Ticket";

        downloadButton.addEventListener("click", () => {
            downloadPdfTicket(registration, event);
        });

        footer.append(footerText, downloadButton);

        card.append(header, body, footer);
        profileTicketList.appendChild(card);
    });
}

// ============================================
// DOWNLOAD PDF TICKET
// ============================================

async function downloadPdfTicket(registration, event) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("PDF library could not load. Please refresh the page.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const navy = [30, 41, 57];
    const header = [37, 52, 73];
    const orange = [255, 128, 88];
    const white = [255, 255, 255];
    const muted = [185, 198, 217];
    const green = [140, 228, 182];

    // Background
    pdf.setFillColor(...navy);
    pdf.rect(0, 0, 210, 297, "F");

    // Main ticket panel
    pdf.setFillColor(...header);
    pdf.roundedRect(12, 15, 186, 267, 5, 5, "F");

    // Header branding
    pdf.setTextColor(...white);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(27);
    pdf.text("EVENTO", 24, 34);

    pdf.setTextColor(...orange);
    pdf.text(".", 111, 34);

    pdf.setFontSize(10);
    pdf.text("YOUR DIGITAL EVENT PASS", 24, 43);

    // Valid ticket badge
    pdf.setFillColor(24, 61, 50);
    pdf.roundedRect(145, 23, 43, 12, 6, 6, "F");

    pdf.setTextColor(...green);
    pdf.setFontSize(9);
    pdf.text("VALID TICKET", 166.5, 30.5, {
        align: "center"
    });

    // Header separator
    pdf.setDrawColor(100, 115, 135);
    pdf.setLineDash([1, 1], 0);
    pdf.line(12, 55, 198, 55);
    pdf.setLineDash([], 0);

    // Event information
    pdf.setTextColor(...orange);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text((event.category || "EVENT").toUpperCase() + " EVENT", 24, 70);

    pdf.setTextColor(...white);
    pdf.setFontSize(21);

    const titleLines = pdf.splitTextToSize(event.title, 145);
    pdf.text(titleLines, 24, 84);

    let y = 84 + titleLines.length * 9 + 8;

    // Participant
    function addDetail(label, value) {
        pdf.setTextColor(...orange);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text(label, 24, y);

        y += 7;

        pdf.setTextColor(...white);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);

        const lines = pdf.splitTextToSize(String(value || "-"), 145);
        pdf.text(lines, 24, y);

        y += lines.length * 6 + 8;
    }

    addDetail(
        "PARTICIPANT",
        registration.name || currentUser.name
    );

    addDetail(
        "DATE & TIME",
        event.displayDate + " · " + event.time
    );

    addDetail(
        "VENUE",
        event.venue
    );

    // Registration ID separator
    pdf.setDrawColor(70, 85, 105);
    pdf.line(24, y, 186, y);

    y += 10;

    pdf.setTextColor(...muted);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");

    const bookingId = "BOOKING ID: " + registration.registrationId;
    pdf.text(bookingId, 24, y);

    // QR code
    try {
        const response = await fetch(
            getQRUrl(registration.qrToken, 300)
        );

        if (!response.ok) {
            throw new Error("Unable to fetch QR image");
        }

        const blob = await response.blob();

        const qrData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        // QR white background
        pdf.setFillColor(...white);
        pdf.roundedRect(76, 190, 58, 58, 3, 3, "F");

        pdf.addImage(qrData, "PNG", 80, 194, 50, 50);

        pdf.setTextColor(...orange);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");

        pdf.text("SCAN AT EVENT ENTRY", 105, 258, {
            align: "center"
        });

    } catch (error) {
        console.error("QR download error:", error);

        pdf.setTextColor(...white);
        pdf.setFontSize(9);
        pdf.text(
            "Ticket QR: " + registration.qrToken,
            24,
            225
        );
    }

    // Footer separator
    pdf.setDrawColor(100, 115, 135);
    pdf.setLineDash([1, 1], 0);
    pdf.line(12, 267, 198, 267);
    pdf.setLineDash([], 0);

    // Footer
    pdf.setTextColor(...muted);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    pdf.text("Thank you for choosing EVENTO.", 24, 277);

    pdf.setTextColor(...orange);
    pdf.setFont("helvetica", "bold");
    pdf.text("EVENTO.", 186, 277, {
        align: "right"
    });

    // Download
    pdf.save(
        "EVENTO-" + registration.registrationId + ".pdf"
    );
}

// ============================================
// EDIT PROFILE
// ============================================

editProfileBtn?.addEventListener("click", () => {
    if (!currentUser) {
        alert("Please log in first.");
        return;
    }

    editProfileName.value = profileName?.textContent || currentUser.name;
    editProfilePhoto.value = "";
    selectedProfilePhoto = "";

    editProfileModal?.classList.add("active");
});

function closeEditProfileModal() {
    editProfileModal?.classList.remove("active");
}

closeProfileModal?.addEventListener("click", closeEditProfileModal);
cancelProfileEdit?.addEventListener("click", closeEditProfileModal);

// ============================================
// PROFILE PHOTO
// ============================================

editProfilePhoto?.addEventListener("change", () => {
    const file = editProfilePhoto.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select a valid image.");
        editProfilePhoto.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert("Please select an image smaller than 2 MB.");
        editProfilePhoto.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        selectedProfilePhoto = reader.result;
    };

    reader.readAsDataURL(file);
});

// ============================================
// SAVE PROFILE
// ============================================

editProfileForm?.addEventListener("submit", event => {
    event.preventDefault();

    const newName = editProfileName.value.trim();

    if (!newName) {
        alert("Please enter your name.");
        return;
    }

    const profiles = getSavedProfiles();
    const existing = profiles[currentUser.email] || {};

    profiles[currentUser.email] = {
        name: newName,
        photo: selectedProfilePhoto || existing.photo || ""
    };

    saveSavedProfiles(profiles);

    currentUser.name = newName;

    localStorage.setItem(
        "evento-current-user",
        JSON.stringify(currentUser)
    );

    // Also update the mock user record
    const users = getMockUsers();
    const userIndex = users.findIndex(user =>
        user.email === currentUser.email
    );

    if (userIndex !== -1) {
        users[userIndex].name = newName;
        saveMockUsers(users);
    }

    closeEditProfileModal();
    loadProfile();
});

// ============================================
// LOGOUT
// ============================================

logoutBtn?.addEventListener("click", () => {
    if (!confirm("Are you sure you want to log out?")) return;

    localStorage.removeItem("evento-current-user");
    localStorage.removeItem("evento-last-email");

    currentUser = null;

    window.location.reload();
});

// Initialize
loadProfile();