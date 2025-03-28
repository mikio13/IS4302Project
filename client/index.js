const express = require("express");
const QRCode = require("qrcode");
const path = require("path");

const { insertUser, getAllUsers, getUserById, disconnect, getAllTickets } = require("./lib/database");
const { ObjectId } = require("mongodb");

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware to parse URL-encoded form data.
app.use(express.urlencoded({ extended: true }));

// Home page.
app.get("/", (req, res) => {
    res.render("main");
});

// Display "Create New Customer" form.
app.get("/customers/new", (req, res) => {
    res.render("newUser");
});

// Handle new customer form submission.
app.post("/customers/new", async (req, res) => {
    try {
        const { name, hashedNRIC } = req.body;
        await insertUser({ name, hashedNRIC });
        res.redirect("/customers/list");
    } catch (error) {
        res.status(500).send("Error creating user: " + error.message);
    }
});

// List all customers.
app.get("/customers/list", async (req, res) => {
    try {
        const users = await getAllUsers();
        res.render("listUsers", { users });
    } catch (error) {
        res.status(500).send("Error listing users: " + error.message);
    }
});

// Generate a QR code for a specific user (simulate ticket generation).
app.get("/customers/:id/qr", async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await getUserById(userId);
        if (!user) return res.status(404).send("User not found");
        // The QR code encodes a verification URL that includes the user's MongoDB _id.
        const verificationUrl = `http://localhost:${port}/verify?userId=${user._id}`;
        const qrImageData = await QRCode.toDataURL(verificationUrl);
        res.render("qr", { user, qrImageData });
    } catch (error) {
        res.status(500).send("Error generating QR code: " + error.message);
    }
});

// Simple verification page (for demo purposes).
app.get("/verify", (req, res) => {
    const userId = req.query.userId;
    res.render("verify", { userId });
});

// List tickets (populated/updated by blockchain events via eventListener.js).
app.get("/tickets", async (req, res) => {
    try {
        const tickets = await getAllTickets();
        res.render("ticketList", { tickets });
    } catch (error) {
        res.status(500).send("Error retrieving tickets: " + error.message);
    }
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});