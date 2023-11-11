const { User } = require('../models');
const bcrypt = require('bcrypt');

//Authenticate User
exports.authenticateUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ error: 'Missing Authorization Header' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const [email, password] = Buffer.from(base64Credentials, 'base64').toString('ascii').split(':');

    User.findOne({ where: { email } }).then(user => {
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                console.error("Error comparing passwords:", err);
                return res.status(500).json({ error: "Internal Server Error" });
            }

            if (result) {
                req.user = user;
                next();
            } else {
                return res.status(401).json({ error: "Incorrect password" });
            }
        });
    });
};

//Login Method
exports.login = (req, res) => {
    const { email, password } = req.body;

    User.findOne({ where: { email } }).then(user => {
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                console.error("Error comparing passwords:", err);
                return res.status(500).json({ error: "Internal Server Error" });
            }

            if (result) {
                const base64Credentials = Buffer.from(`${email}:${password}`).toString('base64');
                return res.json({ credentials: `Basic ${base64Credentials}` });
            } else {
                return res.status(401).json({ error: "Incorrect password" });
            }
        });
    });
};
