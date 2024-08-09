const jwt = require("jsonwebtoken");


function clientAuth(req, res, next) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    jwt.verify(token, "ae2d8329d69cb40ef776f4d64c9b20ee67971cfd3df455f199d1f500712018fc", (err, payload) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        console.log("adminAuth ", payload);
        if (payload.userType == "Client") {
            next();
        }
        else {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    });

}

module.exports = clientAuth;
