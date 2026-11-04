
const totalRegistrations = document.getElementById("totalRegistrations");
const checkedInCount = document.getElementById("checkedInCount");
const pendingCount = document.getElementById("pendingCount");

const scanResult = document.getElementById("scanResult");
const startScannerBtn = document.getElementById("startScanner");
const stopScannerBtn = document.getElementById("stopScanner");

let html5QrCode = null;
let scannerRunning = false;

// Read registrations saved by the main EVENTO website
function getOrganizerRegistrations() {
    try {
        const data = localStorage.getItem("evento-registrations");
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error reading registrations:", error);
        return [];
    }
}

// Save updated registrations
function saveOrganizerRegistrations(registrations) {
    localStorage.setItem(
        "evento-registrations",
        JSON.stringify(registrations)
    );
}

// Update dashboard statistics
function updateOrganizerStats() {
    const registrations = getOrganizerRegistrations();

    const checkedIn = registrations.filter(
        registration => registration.checkedIn === true
    ).length;

    totalRegistrations.textContent = registrations.length;
    checkedInCount.textContent = checkedIn;
    pendingCount.textContent = registrations.length - checkedIn;
}

// Display scanner result
function showScanResult(message, success = false) {
    scanResult.style.display = "block";
    scanResult.style.border = success
        ? "1px solid #16834a"
        : "1px solid #d9534f";

    scanResult.textContent = message;
}

// Verify scanned QR code
function verifyTicket(decodedText) {
    let ticket;

    try {
        ticket = JSON.parse(decodedText);
    } catch (error) {
        showScanResult("Invalid QR code format.");
        return;
    }

    const registrations = getOrganizerRegistrations();

    const registration = registrations.find(
        item => item.registrationId === ticket.registrationId
    );

    if (!registration) {
        showScanResult("Ticket not found in EVENTO registrations.");
        return;
    }

    if (Number(registration.eventId) !== Number(ticket.eventId)) {
        showScanResult("Invalid event ticket.");
        return;
    }
    // Verify participant name
if (
    registration.name.trim().toLowerCase() !==
    String(ticket.name).trim().toLowerCase()
) {
    showScanResult("Participant details do not match.");
    return;
}

    if (registration.checkedIn === true) {
        showScanResult(
            `Already checked in: ${registration.name}`
        );
        return;
    }

    registration.checkedIn = true;
    registration.checkInTime = new Date().toISOString();

    saveOrganizerRegistrations(registrations);
    updateOrganizerStats();

    showScanResult(
        `Valid ticket! Welcome, ${registration.name}. Check-in successful.`,
        true
    );
}

// Start QR scanner
startScannerBtn.addEventListener("click", async () => {
    if (scannerRunning) return;

    if (!window.Html5Qrcode) {
        showScanResult("QR scanner library is not loaded. Refresh the page.");
        return;
    }

    html5QrCode = new Html5Qrcode("reader");

    try {
        await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            decodedText => {
                html5QrCode.pause();
                verifyTicket(decodedText);
            },
            () => {}
        );

        scannerRunning = true;
        showScanResult("Camera started. Point it at an EVENTO QR ticket.", true);

    } catch (error) {
        showScanResult("Camera could not start. Allow camera permission and try again.");
        console.error(error);
    }
});

// Stop QR scanner
stopScannerBtn.addEventListener("click", async () => {
    if (!html5QrCode || !scannerRunning) return;

    try {
        await html5QrCode.stop();
        html5QrCode.clear();
        scannerRunning = false;
        showScanResult("Scanner stopped.");
    } catch (error) {
        console.error(error);
        showScanResult("Could not stop the scanner.");
    }
});

// Manual ticket verification
document.getElementById("verifyManualTicket").addEventListener("click", () => {
    const registrationId = document
        .getElementById("manualRegistrationId")
        .value.trim();

    if (!registrationId) {
        showScanResult("Please enter a registration ID.");
        return;
    }

    const registrations = getOrganizerRegistrations();

    const registration = registrations.find(
        item => item.registrationId.toLowerCase() === registrationId.toLowerCase()
    );

    if (!registration) {
        showScanResult("Registration ID not found.");
        return;
    }

    // Build the same ticket data expected by verifyTicket()
    const ticketData = JSON.stringify({
        registrationId: registration.registrationId,
        eventId: registration.eventId,
        name: registration.name
    });

    verifyTicket(ticketData);
});

// Initialize dashboard
updateOrganizerStats();
