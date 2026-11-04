
const express = require("express");
const cors = require("cors");

const app = express();

// Import routes
const eventRoutes = require("./routes/events");
const authRoutes = require("./routes/auth");
const registrationRoutes = require("./routes/registrations");
const ticketRoutes = require("./routes/tickets");

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to EVENTO API"
    });
});

// API routes
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/tickets", ticketRoutes);

module.exports = app;
