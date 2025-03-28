const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");

app.use(cors());
app.use(express.json());

const userRoutes = require("./routes/api_users.routes");

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/users", userRoutes);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});