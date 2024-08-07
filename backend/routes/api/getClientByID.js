
module.exports = (req, res) => {
    ClientID = req.params.id
    res.json({
        message: 'Client fetched successfully',
        nurse: {
            "test": "test"
        }
    });
}