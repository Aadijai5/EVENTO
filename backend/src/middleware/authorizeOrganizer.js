function authorizeOrganizer(req, res, next) {
    if (req.user.role !== "organizer" &&
        req.user.role !== "admin") {

        return res.status(403).json({
            success: false,
            message: "Access denied. Organizer permission required."
        });
    }

    next();
}

module.exports = authorizeOrganizer;