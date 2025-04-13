const { storeUserMapping, findUserByHash } = require("../lib/database");

const storeUser = async (req, res) => {
    const { hashedNRIC, nric, name } = req.body;

    if (!hashedNRIC || !nric || !name) {
        return res.status(400).json({ error: "Missing fields in request body" });
    }

    try {
        await storeUserMapping(hashedNRIC, nric, name);
        return res.status(201).json({ success: true });
    } catch (err) {
        console.error("Failed to store user mapping:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

const getUserByHashedNRIC = async (req, res) => {
    const { hashedNRIC } = req.params;

    if (!hashedNRIC) {
        return res.status(400).json({ error: "Missing hashedNRIC in path" });
    }

    try {
        const user = await findUserByHash(hashedNRIC);
        if (!user) return res.status(404).json({ error: "User not found" });

        return res.status(200).json(user);
    } catch (err) {
        console.error("Failed to retrieve user:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    storeUser,
    getUserByHashedNRIC
};