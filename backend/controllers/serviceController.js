// controllers/serviceController.js
const Service = require('../models/Service');

// Get all services
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new service (for testing purpose)
exports.createService = async (req, res) => {
  const { name, image, test } = req.body;
  
  const service = new Service({ name, image, test });
  
  try {
    const newService = await service.save();
    res.status(201).json(newService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
