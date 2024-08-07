
module.exports = (req, res) => {

    const { firstName, lastName } = req.body;

    res.json({
        message: 'Client created successfully',
        id: "test"
    });

}