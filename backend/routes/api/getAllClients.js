
module.exports = (req, res) => {

    res.json({
        message: 'Clients fetched successfully',
        nurses: {
            "test": "test"
        }
    })
}