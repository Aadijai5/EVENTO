
const express = require("express");
const pool = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// GET MY TICKETS
router.get("/my", verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                t.id AS ticket_id,
                t.qr_token,
                t.is_valid,

                r.id AS registration_id,
                r.registration_code,
                r.status AS registration_status,
                r.checked_in,
                r.check_in_time,

                e.id AS event_id,
                e.title,
                e.category,
                TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
                e.start_time,
                e.end_time,
                e.venue,
                e.image_url

            FROM tickets t

            JOIN registrations r
                ON t.registration_id = r.id

            JOIN events e
                ON r.event_id = e.id

            WHERE r.user_id = $1
            AND r.status = 'confirmed'
            AND t.is_valid = TRUE

            ORDER BY r.created_at DESC`,
            [req.user.id]
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            tickets: result.rows
        });

    } catch (error) {
        console.error("Fetch tickets error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch tickets"
        });
    }
});

// VERIFY QR TICKET AND MARK ATTENDANCE
router.post("/verify", verifyToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const { qr_token } = req.body;

        if (!qr_token) {
            return res.status(400).json({
                success: false,
                message: "QR token is required"
            });
        }

        await client.query("BEGIN");

        // Find and lock the ticket
        const result = await client.query(
            `SELECT
                t.id AS ticket_id,
                t.is_valid,
                r.id AS registration_id,
                r.status AS registration_status,
                r.checked_in,
                e.id AS event_id,
                e.title
             FROM tickets t
             JOIN registrations r
                ON t.registration_id = r.id
             JOIN events e
                ON r.event_id = e.id
             WHERE t.qr_token = $1
             FOR UPDATE OF t, r`,
            [qr_token]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Invalid ticket"
            });
        }

        const ticket = result.rows[0];

        if (!ticket.is_valid ||
            ticket.registration_status !== "confirmed") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Ticket is cancelled or invalid"
            });
        }

        if (ticket.checked_in) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "Ticket already checked in"
            });
        }

        // Mark attendance
        await client.query(
            `UPDATE registrations
             SET checked_in = TRUE,
                 check_in_time = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [ticket.registration_id]
        );

        await client.query("COMMIT");

        res.status(200).json({
            success: true,
            message: "Ticket verified. Entry allowed!",
            event: ticket.title,
            ticket_id: ticket.ticket_id,
            registration_id: ticket.registration_id,
            checked_in: true
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Ticket verification error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to verify ticket"
        });

    } finally {
        client.release();
    }
});

module.exports = router;
