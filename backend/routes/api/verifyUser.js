const User = require("../../models/User");

module.exports = (req, res) => {
    const token = req.params.id;
    const verifyEmail = async (token) => {
        const User = await User.findOneAndUpdate({
            'verificationToken.token': token,
            'verificationToken.expires': { $gt: Date.now() } // Check that the token has not expired
        }, {
            "activated": true,
            "verificationToken.token": null
        });

        if (!User) {
            console.log("Email could not be verified");
            res.status(500).json({ message: 'Error verifying account' });
        }
        else {
            console.log("Email verified");
            res.send("Email verified");
        }
    };
    verifyEmail(token);
}