const Driver = require('../models/Driver');
const User = require('../models/User');

// Get all drivers
exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find().populate('user_id');
        res.status(200).json(drivers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }
};

// Get a driver by ID


// Create a new driver
exports.getDriverById = async (req, res) => {
    //console.log(req.params.id);
    try {
        const Driver = await Driver.findById(req.params.id).populate('user_id');
        res.json(Driver);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}


exports.isDriverValid = (newDriver) => {
    let errorList = [];
    if (!newDriver.firstName) {
        errorList[errorList.length] = "Please enter first name";
    }
    if (!newDriver.lastName) {
        errorList[errorList.length] = "Please enter last name";
    }
    if (!newDriver.phone) {
        errorList[errorList.length] = "Please enter phone";
    }
   

    if (errorList.length > 0) {
        result = {
            status: false,
            errors: errorList
        }
        return result;
    }
    else {
        return { status: true };
    }

}



exports.editDriverActivatedStatus = async (req, res) => {
    try {
       
        const { activated } = req.body;
        const Driver = await Driver.findById(req.params.user_id).populate('user_id');

        // Modifier l'état "activated" de l'utilisateur
        await editActivatedStatus(Driver.user_id, activated);

        res.status(200).json({ message: "Statut 'activated' mis à jour avec succès" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

exports.saveDriver = async (req, res) => {
    let newDriver = req.body;

    let DriverValidStatus = isDriverValid(newDriver);
    if (!DriverValidStatus.status) {
        res.status(400).json({
            message: 'error',
            errors: DriverValidStatus.errors
        });
    }
    else {

        User.create(
            {
                phone: newDriver.phone,
                
                firstName: newDriver.firstName,
                lastName: newDriver.lastName,
              
                userType: 'Driver',
                activated: false,
            },
           

            (error, user_idetails) => {
                if (error) {
                    res.json({ message: "error", errors: [error.message] });
                } else {
                   

                  
                        Driver.create(
                            {
                                user_id: user_idetails._id,
                              
                               
                               
                                additional_driver_info : newDriver.additional_driver_info ,
                            },
                            (error2, DriverDetails) => {
                                if (error2) {
                                    User.deleteOne({ _id: user_idetails._id });
                                    res.json({ message: "error", errors: [error2.message] });
                                } else {
                                   
                                    res.json({ message: "success" });
                                }
                            }
                        );}});













        
    }
}

// Update a driver
exports.updateDriver = async (req, res) => {
    let newDriver = req.body;

    let DriverValidStatus = isDriverValid(newDriver);
    if (!DriverValidStatus.status) {
        res.status(400).json({
            message: 'error',
            errors: DriverValidStatus.errors
        });
    }
    else {
        try {

            await Driver.updateOne({ _id: req.params.id }, { $set: { "additional_driver_info": req.body.additional_driver_info } });

           await User.updateOne({ _id: req.body.user_id }, { $set: { "firstName": req.body.firstName, "lastName": req.body.lastName, "phone": req.body.phone,  } });

            res.status(201).json({ message: 'success' });
        } catch (error) {
            res.status(400).json({ message: 'error', errors: [error.message] });
        }
    }
}

// Delete a driver
exports.deleteDriver = async (req, res) => {
    try {
        const Driver = await Driver.findById(req.params.id).populate('user_id');

        await Driver.deleteOne({ _id: req.params.id });

         await User.deleteOne({ _id: Driver.user_id });
        res.status(200).json();
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
exports.getDriverByDeviceId = async (req, res) => {
    const { deviceId } = req.body;  // Extract deviceId from the body

    try {
        // Find the user by deviceId
        const user = await User.findOne({ deviceId });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Find the driver using user_id
        const driver = await Driver.findOne({ user_id: user._id });
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found.' });
        }

        // Return driver info
        return res.status(200).json({ driverId: driver._id, driverInfo: driver });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};



exports.updateDriverAvailability = async (req, res) => {
    const { driverId, isDisponible } = req.body; // Get driverId and new availability status from the request
  
    try {
      const driver = await Driver.findById(driverId); // Find driver by ID
  
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
  
      // Update the availability status
      driver.isDisponible = isDisponible;
      await driver.save(); // Save the updated driver
  
      return res.status(200).json({ message: 'Driver availability updated successfully', driver });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  };