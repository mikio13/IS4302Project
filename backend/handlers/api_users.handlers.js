const { insertUser } = require("../lib/database");

const insertUserJSON = async (req, res) => {
    let { name, nric } = req.body; //destructuring to make code shorter

    const user = await insertUser({
        name: name,
        nric: nric,
    });

    return res.status(201).json(user);
};

module.exports = {
    insertUserJSON,
};