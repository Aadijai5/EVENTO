// EVENTO - FRONTEND ONLY (mock data + localStorage)
// Load events.js BEFORE this file.
const events = window.EVENTO_EVENTS || [];
const eventGrid = document.getElementById("eventGrid");
const searchInput = document.getElementById("searchInput");
const emptyMessage = document.getElementById("emptyMessage");
const eventModal = document.getElementById("eventModal");
const registrationModal = document.getElementById("registrationModal");
const successModal = document.getElementById("successModal");
const ticketModal = document.getElementById("ticketModal");
const registrationForm = document.getElementById("registrationForm");
const registeredEvents = document.getElementById("registeredEvents");
const ticketDetails = document.getElementById("ticketDetails");

let selectedCategory = "All";
let selectedPrice = "all";

function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
}

function getRegistrations() {
    try {
        const data = JSON.parse(localStorage.getItem("evento-registrations") || "[]");
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveRegistrations(data) {
    localStorage.setItem("evento-registrations", JSON.stringify(data));
}

function ticketId() {
    return "EVT-" + Date.now().toString(36).toUpperCase() +
        "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

function qrToken() {
    return window.crypto?.randomUUID?.() ||
        ("evento-" + Date.now() + "-" + Math.random().toString(36).slice(2));
}

function findEvent(id) {
    return events.find(e => Number(e.id) === Number(id));
}

function imageMarkup(event) {
    return event.image
        ? `<img src="${safe(event.image)}" alt="${safe(event.title)}" loading="lazy">`
        : `<div class="event-image-placeholder"><span>EVENTO</span><p>Discover Something Amazing</p></div>`;
}

function priceLabel(price) {
    return Number(price) === 0
        ? '<span class="price-badge free">FREE</span>'
        : `<span class="price-badge paid">PAID · ₹${safe(price)}</span>`;
}

// EVENT LIST + FILTERS
function displayEvents(list) {
    if (!eventGrid) return;
    eventGrid.innerHTML = "";

    if (!list.length) {
        if (emptyMessage) emptyMessage.hidden = false;
        return;
    }
    if (emptyMessage) emptyMessage.hidden = true;

    list.forEach(event => {
        const card = document.createElement("article");
        card.className = "event-card";
        card.innerHTML = `
            <div class="event-card-image">
                ${imageMarkup(event)}
                <span class="event-category">${safe(event.category)}</span>
            </div>
            <div class="event-card-body">
                <div class="event-title-row">
                    <h3>${safe(event.title)}</h3>${priceLabel(event.price)}
                </div>
                <div class="event-meta"><span>📅</span><span>${safe(event.displayDate)}</span></div>
                <div class="event-meta"><span>📍</span><span>${safe(event.venue)}</span></div>
                <p>${safe(event.description)}</p>
                <div class="event-card-actions">
                    <button class="details-button" data-action="details" data-id="${safe(event.id)}">View Details</button>
                    <button class="register-button" data-action="register" data-id="${safe(event.id)}">Register</button>
                </div>
            </div>`;
        eventGrid.appendChild(card);
    });
}

function filterEvents() {
    if (!Array.isArray(events)) return;
    const term = (searchInput?.value || "").toLowerCase().trim();

    const list = events.filter(event => {
        const categoryOK = selectedCategory === "All" || event.category === selectedCategory;
        const searchOK = [event.title, event.category, event.venue, event.description]
            .join(" ").toLowerCase().includes(term);
        const priceOK = selectedPrice === "all" ||
            (selectedPrice === "free" && Number(event.price) === 0) ||
            (selectedPrice === "paid" && Number(event.price) > 0);
        return categoryOK && searchOK && priceOK;
    });
    displayEvents(list);
}

document.querySelectorAll(".category-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
        button.classList.add("active");
        selectedCategory = button.dataset.category || "All";
        filterEvents();
    });
});

document.querySelectorAll(".price-filter-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".price-filter-btn").forEach(b => b.classList.remove("active"));
        button.classList.add("active");
        selectedPrice = button.dataset.price || "all";
        filterEvents();
    });
});
searchInput?.addEventListener("input", filterEvents);

// MODALS
function openModal(modal) {
    if (!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    if (!document.querySelector(".modal.active")) document.body.style.overflow = "";
}

document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => closeModal(document.getElementById(button.dataset.close)));
});
document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", e => {
        if (e.target === modal) closeModal(modal);
    });
});
document.addEventListener("keydown", e => {
    if (e.key === "Escape") document.querySelectorAll(".modal.active").forEach(closeModal);
});

// EVENT DETAILS
function showEventDetails(id) {
    const event = findEvent(id);
    const content = document.getElementById("eventModalContent");
    if (!event || !content) return;

    content.innerHTML = `
        ${imageMarkup(event)}
        <span class="eyebrow">${safe(event.category)}</span>
        <h2>${safe(event.title)}</h2>
        <p>${safe(event.description)}</p>
        <p><strong>Date:</strong> ${safe(event.displayDate)}</p>
        <p><strong>Time:</strong> ${safe(event.time)}</p>
        <p><strong>Venue:</strong> ${safe(event.venue)}</p>
        <p><strong>Entry Fee:</strong> ${Number(event.price) === 0 ? "Free" : "₹" + safe(event.price)}</p>
        <button class="primary-button" id="detailsRegister">Register Now →</button>`;

    openModal(eventModal);
    document.getElementById("detailsRegister")?.addEventListener("click", () => {
        closeModal(eventModal);
        openRegistration(event.id);
    });
}

function openRegistration(id) {
    const event = findEvent(id);
    if (!event) return;
    document.getElementById("selectedEventId").value = event.id;
    document.getElementById("registrationEventName").textContent =
        `Register for ${event.title} — ${Number(event.price) === 0 ? "FREE" : "₹" + event.price}`;
    registrationForm?.reset();
    document.getElementById("selectedEventId").value = event.id;
    openModal(registrationModal);
}

eventGrid?.addEventListener("click", e => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "details") showEventDetails(button.dataset.id);
    if (button.dataset.action === "register") openRegistration(button.dataset.id);
});

// SUCCESS MESSAGE
function showSuccess(registration) {
    const event = findEvent(registration.eventId);
    const message = document.getElementById("successMessage");
    const info = document.getElementById("successTicketInfo");
    if (message) message.textContent = `You're registered for ${event?.title || registration.eventTitle}!`;
    if (info) info.textContent = `Your ticket ID: ${registration.registrationId}`;
    openModal(successModal);
}

// REGISTER: localStorage only
registrationForm?.addEventListener("submit", e => {
    e.preventDefault();
    const eventId = Number(document.getElementById("selectedEventId").value);
    const event = findEvent(eventId);
    if (!event) return alert("Event not found.");

    const name = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    if (!name || !email || !phone) return alert("Please fill in all fields.");

    const all = getRegistrations();
    const duplicate = all.some(r =>
        Number(r.eventId) === eventId && String(r.email).toLowerCase() === email.toLowerCase()
    );
    if (duplicate) return alert("You are already registered for this event with this email.");

    const registration = {
        registrationId: ticketId(),
        qrToken: qrToken(),
        eventId: event.id,
        eventTitle: event.title,
        name, email, phone,
        registeredAt: new Date().toISOString(),
        checkedIn: false
    };

    all.push(registration);
    saveRegistrations(all);
    closeModal(registrationModal);
    registrationForm.reset();
    displayRegisteredEvents();
    showSuccess(registration);
});

// MY REGISTERED EVENTS
function displayRegisteredEvents() {
    if (!registeredEvents) return;
    const all = getRegistrations();

    if (!all.length) {
        registeredEvents.innerHTML = `
            <div class="empty-registrations">
                <div class="empty-icon">▢</div>
                <h3>No registered events yet</h3>
                <p>Your registered events will appear here.</p>
                <a href="#events" class="secondary-button">Explore Events</a>
            </div>`;
        return;
    }

    registeredEvents.innerHTML = "";
    all.forEach(registration => {
        const event = findEvent(registration.eventId);
        if (!event) return;

        const card = document.createElement("div");
        card.className = "registered-card";
        card.innerHTML = `
            ${imageMarkup(event)}
            <div class="registered-card-info">
                <h3>${safe(event.title)}</h3>
                <p>📅 ${safe(event.displayDate)}</p>
                <p>📍 ${safe(event.venue)}</p>
                <p>Ticket: ${safe(registration.registrationId)}</p>
                <div class="registered-card-actions">
                    <button data-ticket="${safe(registration.registrationId)}">View Ticket</button>
                </div>
            </div>`;
        registeredEvents.appendChild(card);
    });
}

// QR TICKET
function qrURL(token, size = 200) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(token)}`;
}

function ensureQrToken(registration) {
    if (registration.qrToken) return registration.qrToken;
    registration.qrToken = qrToken();
    const all = getRegistrations();
    const index = all.findIndex(r => r.registrationId === registration.registrationId);
    if (index >= 0) {
        all[index].qrToken = registration.qrToken;
        saveRegistrations(all);
    }
    return registration.qrToken;
}

function showTicket(id) {
    const registration = getRegistrations().find(r => r.registrationId === id);
    if (!registration) return alert("Ticket not found.");
    const event = findEvent(registration.eventId);
    if (!event) return alert("Event not found.");

    const token = ensureQrToken(registration);
    ticketDetails.innerHTML = `
        <span class="eyebrow">YOUR DIGITAL EVENT TICKET</span>
        <h2>${safe(event.title)}</h2>
        <p>Registered participant: ${safe(registration.name)}</p>
        <div class="ticket-qr"><img src="${qrURL(token)}" alt="Event ticket QR code"></div>
        <p>Show this QR code at the event entrance.</p>
        <div class="ticket-id">${safe(registration.registrationId)}</div>
        <p>${safe(event.displayDate)} · ${safe(event.venue)}</p>
        <p>Status: ${registration.checkedIn ? "Already checked in" : "Valid"}</p>
        <button class="primary-button download-ticket-btn" id="downloadTicketBtn">↓ Download PDF Ticket</button>`;
    openModal(ticketModal);
}

registeredEvents?.addEventListener("click", e => {
    const button = e.target.closest("[data-ticket]");
    if (button) showTicket(button.dataset.ticket);
});

// PDF DOWNLOAD
async function downloadEventTicket(id) {
    const registration = getRegistrations().find(r => r.registrationId === id);
    if (!registration) return alert("Registration not found.");
    const event = findEvent(registration.eventId);
    if (!event) return alert("Event not found.");
    if (!window.jspdf?.jsPDF) return alert("PDF library is not loaded. Refresh the page.");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    try {
        const response = await fetch(qrURL(ensureQrToken(registration), 250));
        if (!response.ok) throw new Error("QR code could not be loaded.");
        const blob = await response.blob();
        const dataURL = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        pdf.setFillColor(23, 36, 58);
        pdf.roundedRect(15, 15, 180, 267, 5, 5, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(24);
        pdf.text("EVENTO.", 25, 35);
        pdf.setFontSize(10);
        pdf.text("DIGITAL EVENT TICKET", 25, 45);
        pdf.setDrawColor(230, 107, 66);
        pdf.line(25, 75, 185, 75);

        pdf.setFontSize(18);
        pdf.text(String(event.title), 25, 92, { maxWidth: 105 });
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text("PARTICIPANT", 25, 112);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text(String(registration.name || "Guest"), 25, 120, { maxWidth: 105 });

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.text("DATE", 25, 135);
        pdf.setFont("helvetica", "bold");
        pdf.text(String(event.displayDate), 25, 143);
        pdf.setFont("helvetica", "normal");
        pdf.text("TIME", 25, 158);
        pdf.setFont("helvetica", "bold");
        pdf.text(String(event.time || "To be announced"), 25, 166);
        pdf.setFont("helvetica", "normal");
        pdf.text("VENUE", 25, 184);
        pdf.setFont("helvetica", "bold");
        pdf.text(String(event.venue), 25, 192, { maxWidth: 105 });
        pdf.setFont("helvetica", "normal");
        pdf.text("ENTRY FEE", 25, 205);
        pdf.setFont("helvetica", "bold");
        pdf.text(Number(event.price) === 0 ? "FREE" : "INR " + event.price, 25, 213);

        pdf.addImage(dataURL, "PNG", 140, 25, 40, 40);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text("SCAN AT ENTRY", 143, 69);
        pdf.setDrawColor(230, 107, 66);
        pdf.setLineDashPattern([2, 2], 0);
        pdf.line(25, 225, 185, 225);
        pdf.setLineDashPattern([], 0);
        pdf.text("REGISTRATION ID", 25, 237);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text(String(registration.registrationId), 25, 246);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text("Present this ticket at the event entrance.", 25, 265);
        pdf.save(`EVENTO-${registration.registrationId}.pdf`);
    } catch (error) {
        console.error("Ticket PDF error:", error);
        alert("Could not generate the PDF ticket. Check your internet connection and try again.");
    }
}

ticketDetails?.addEventListener("click", e => {
    if (e.target.id !== "downloadTicketBtn") return;
    const id = ticketDetails.querySelector(".ticket-id")?.textContent.trim();
    if (id) downloadEventTicket(id);
});

// NAVIGATION
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
menuToggle?.addEventListener("click", () => navLinks?.classList.toggle("open"));
navLinks?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
});

// SUCCESS MODAL BUTTON
document.getElementById("viewMyEvents")?.addEventListener("click", () => {
    closeModal(successModal);
    document.getElementById("my-events")?.scrollIntoView({ behavior: "smooth" });
});

// NAVBAR PROFILE PHOTO (from mock profile saved in localStorage)
function loadNavbarProfile() {
    const email = localStorage.getItem("evento-last-email");
    const image = document.getElementById("navProfileImage");
    const icon = document.getElementById("navProfileIcon");
    if (!image || !icon) return;

    let profiles = {};
    try {
        profiles = JSON.parse(localStorage.getItem("evento-profiles") || "{}");
    } catch {
        profiles = {};
    }

    const profile = email ? profiles[email.toLowerCase()] : null;
    if (profile?.photo) {
        image.src = profile.photo;
        image.hidden = false;
        icon.hidden = true;
    } else {
        image.hidden = true;
        icon.hidden = false;
    }
}

// INITIALIZE
filterEvents();
displayRegisteredEvents();
loadNavbarProfile();
