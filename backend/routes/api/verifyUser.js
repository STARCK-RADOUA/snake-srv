const User = require("../../models/User");

module.exports = (req, res) => {
    const token = req.params.id;
    const verifyphone = async (token) => {
        const User = await User.findOneAndUpdate({
            'verificationToken.token': token,
            'verificationToken.expires': { $gt: Date.now() } // Check that the token has not expired
        }, {
            "activated": true,
            "verificationToken.token": null
        });

        if (!User) {
            console.log("phone could not be verified");
            res.status(500).json({ message: 'Error verifying account' });
        }
        else {
            console.log("phone verified");
            res.send("phone verified");
        }
    };
    verifyphone(token);
}