const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");

app.use(cors());
app.use(express.json());

const queueRoutes = require("./routes/api_queue.routes");

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/queue", queueRoutes);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});