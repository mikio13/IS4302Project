const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");

// Enable CORS so the frontend can make API requests
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Import the queue-related API routes
const queueRoutes = require("./routes/api_queue.routes");

app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Mount all queue-related endpoints under /queue
app.use("/queue", queueRoutes);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});