const express = require("express");
const QRCode = require("qrcode");
const { insertUser, getAllUsers, getUserById, disconnect } = require("./lib/database");
const { ObjectId } = require("mongodb"); // For querying by _id

const app = express();
const port = 3000;

// Set up EJS as our view engine
app.set("view engine", "ejs");

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// -------------- ROUTES -------------- //

// 1. Home Page
app.get("/", (req, res) => {
    // Render main.ejs
    res.render("main");
});

// 2. Show "Create New User" form
app.get("/customers/new", (req, res) => {
    res.render("newUser");
});

// 3. Handle "Create New User" form submission
app.post("/customers/new", async (req, res) => {
    try {
        // Collect form data (e.g., name, hashedNRIC).
        const { name, hashedNRIC } = req.body;

        // Insert into MongoDB
        await insertUser({ name, hashedNRIC });

        // Redirect to list of users after insertion
        res.redirect("/customers/list");
    } catch (error) {
        res.status(500).send("Error creating user: " + error.message);
    }
});

// 4. List All Users
app.get("/customers/list", async (req, res) => {
    try {
        const users = await getAllUsers();
        res.render("listUsers", { users });
    } catch (error) {
        res.status(500).send("Error listing users: " + error.message);
    }
});

// 5. Generate a QR code for a given user (simulating a "ticket")
app.get("/customers/:id/qr", async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }

        // For demonstration, we’ll encode a simple URL or message
        // In a real system, this might be: http://yourdomain/verify?userId=...
        const verificationUrl = `http://localhost:${port}/verify?userId=${user._id}`;

        // Generate a Data URL for the QR code
        const qrImageData = await QRCode.toDataURL(verificationUrl);

        // Render a page showing the QR code
        res.render("qr", { user, qrImageData });
    } catch (error) {
        res.status(500).send("Error generating QR code: " + error.message);
    }
});

// 6. "Verify" page - a simple demonstration
app.get("/verify", (req, res) => {
    const userId = req.query.userId;
    // In a real scenario, you'd check on-chain data or your DB to confirm ownership.
    res.render("verify", { userId });
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});