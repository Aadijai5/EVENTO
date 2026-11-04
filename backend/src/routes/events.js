const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const authorizeOrganizer = require("../middleware/authorizeOrganizer");
const pool = require("../config/db");

// GET all published events
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM events
             WHERE status = 'published'
             ORDER BY event_date ASC`
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            events: result.rows
        });

    } catch (error) {
        console.error("Fetch events error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch events"
        });
    }
});
// CREATE EVENT (Organizer only)
router.post("/", verifyToken, authorizeOrganizer, async (req, res) => {
    try {
        const {
            title,
            category,
            description,
            event_date,
            start_time,
            end_time,
            venue,
            image_url,
            price,
            capacity
        } = req.body;

        if (
            !title || !category || !event_date ||
            !start_time || !venue || !capacity
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required event details"
            });
        }

        const result = await pool.query(
            `INSERT INTO events (
                title, category, description,
                event_date, start_time, end_time,
                venue, image_url, price, capacity,
                organizer_id, status
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'published')
            RETURNING *`,
            [
                title,
                category,
                description || null,
                event_date,
                start_time,
                end_time || null,
                venue,
                image_url || null,
                price ?? 0,
                capacity,
                req.user.id
            ]
        );

        res.status(201).json({
            success: true,
            message: "Event created successfully",
            event: result.rows[0]
        });

    } catch (error) {
        console.error("Create event error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to create event"
        });
    }
});


// GET SINGLE EVENT BY ID
router.get("/:id", async (req, res) => {
    try {
        const eventId = Number(req.params.id);

        if (!Number.isInteger(eventId) || eventId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID"
            });
        }

        const result = await pool.query(
            `SELECT
                e.id,
                e.title,
                e.category,
                e.description,
                e.event_date,
                e.start_time,
                e.end_time,
                e.venue,
                e.image_url,
                e.price,
                e.capacity,
                e.status,
                u.name AS organizer_name
             FROM events e
             JOIN users u ON e.organizer_id = u.id
             WHERE e.id = $1
             AND e.status = 'published'`,
            [eventId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        res.status(200).json({
            success: true,
            event: result.rows[0]
        });

    } catch (error) {
        console.error("Fetch event error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch event details"
        });
    }
});

module.exports = router;