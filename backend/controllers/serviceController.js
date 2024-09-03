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



exports.getServicebyid = async (req, res) => {
  const { id } = req.params; // Extracting id from URL parameters, if using params (preferred for get requests)

  try {
    // Fetch the service by ID
    const service = await Service.findById(id);

    // If no service is found, return a 404 error
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Return the service if found
    res.status(200).json(service);
  } catch (err) {
    // Handle possible errors (e.g., invalid ObjectId format)
    res.status(500).json({ message: err.message });
  }
};


// Create a new service (for testing purpose)
exports.createService = async (req, res) => {
  const { name, image, test } = req.body;
  
  const service = new Service({ name, image, test });
  
  try {
    const newService = await service.save();
     // Delay importing `io` until after the service is saved
    
    res.status(201).json(newService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.addService = async (req, res) => {
  const { name, image, test, isSystemPoint } = req.body;

  // Create a new Service instance with the provided data
  const service = new Service({ name, image, test, isSystemPoint });

  try {
    // Save the service to the database
    const newService = await service.save();

    // Import the io instance dynamically
    const { io } = require('../index');

    // Emit the updated services event to all connected clients
    const services = await Service.find();

    io.emit('servicesUpdated', { services });

    // Respond with the newly created service
    res.status(201).json(newService);
  } catch (err) {
    // Respond with an error if saving fails
    res.status(400).json({ message: err.message });
  }
};


exports.updateService = async (req, res) => {
  const { id } = req.params;
  const { name, image, test, isSystemPoint } = req.body;

  try {
    // Find the service by ID
    const service = await Service.findById(id);

    // If service not found, return an error
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Update service fields with the data provided in the request body
    service.name = name !== undefined ? name : service.name;
    service.image = image !== undefined ? image : service.image;
    service.test = test !== undefined ? test : service.test;
    service.isSystemPoint = isSystemPoint !== undefined ? isSystemPoint : service.isSystemPoint;

    // Save the updated service to the database
    const updatedService = await service.save();

        // Import the io instance dynamically
        const { io } = require('../index');

        // Emit the updated services event to all connected clients
        const services = await Service.find();
    
        io.emit('servicesUpdated', { services });
    

    // Respond with the updated service
    res.status(200).json(updatedService);
  } catch (err) {
    // Respond with an error if something goes wrong
    res.status(400).json({ message: err.message });
  }
};


// Delete a service by ID
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the service by ID and delete it
    const deletedService = await Service.findByIdAndDelete(id);

    if (!deletedService) {
      return res.status(404).json({ message: 'Service not found' });
    }


        // Import the io instance dynamically
        const { io } = require('../index');

        // Emit the updated services event to all connected clients
        const services = await Service.find();
    
        io.emit('servicesUpdated', { services });
    

    res.status(200).json({ message: 'Service deleted successfully', service: deletedService });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Failed to delete service', error: error.message });
  }
};
