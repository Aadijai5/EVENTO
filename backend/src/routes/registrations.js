
const express = require("express");
const pool = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// REGISTER FOR AN EVENT
router.post("/:eventId", verifyToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const eventId = Number(req.params.eventId);
        const userId = req.user.id;

        if (!Number.isInteger(eventId) || eventId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID"
            });
        }

        await client.query("BEGIN");

        // Lock event to prevent overbooking
        const eventResult = await client.query(
            `SELECT id, title, capacity, status
             FROM events
             WHERE id = $1
             FOR UPDATE`,
            [eventId]
        );

        if (eventResult.rows.length === 0 ||
            eventResult.rows[0].status !== "published") {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Event not found or unavailable"
            });
        }

        const event = eventResult.rows[0];

        // Check duplicate registration
        const existing = await client.query(
            `SELECT id FROM registrations
             WHERE user_id = $1 AND event_id = $2`,
            [userId, eventId]
        );

        if (existing.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "You are already registered for this event"
            });
        }

        // Check event capacity
        const countResult = await client.query(
            `SELECT COUNT(*)::INTEGER AS total
             FROM registrations
             WHERE event_id = $1
             AND status = 'confirmed'`,
            [eventId]
        );

        if (countResult.rows[0].total >= event.capacity) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "Event is fully booked"
            });
        }

        // Create registration
        const registrationResult = await client.query(
            `INSERT INTO registrations (user_id, event_id)
             VALUES ($1, $2)
             RETURNING id, registration_code, created_at`,
            [userId, eventId]
        );

        const registration = registrationResult.rows[0];

        // Generate unique ticket
        const ticketResult = await client.query(
            `INSERT INTO tickets (registration_id)
             VALUES ($1)
             RETURNING id, qr_token`,
            [registration.id]
        );

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: "Event registration successful",
            registration,
            ticket: ticketResult.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Registration error:", error.message);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "You are already registered for this event"
            });
        }

        res.status(500).json({
            success: false,
            message: "Unable to register for event"
        });

    } finally {
        client.release();
    }
});


// GET MY REGISTERED EVENTS
router.get("/my", verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                r.id AS registration_id,
                r.registration_code,
                r.status AS registration_status,
                r.checked_in,
                r.created_at AS registered_at,

                e.id AS event_id,
                e.title,
                e.category,
                e.description,
                TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
                e.start_time,
                e.end_time,
                e.venue,
                e.image_url,
                e.price,

                t.id AS ticket_id,
                t.qr_token,
                t.is_valid

            FROM registrations r

            JOIN events e
                ON r.event_id = e.id

            LEFT JOIN tickets t
                ON r.id = t.registration_id

            WHERE r.user_id = $1
            ORDER BY r.created_at DESC`,
            [req.user.id]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            registrations: result.rows
        });

    } catch (error) {
        console.error("My registrations error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch registered events"
        });
    }
});

module.exports = router;
