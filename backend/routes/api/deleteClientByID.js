

module.exports = (req, res) => {
    ClientID = req.params.id
    res.json({
        message: 'Client deleted successfully'
    });

}