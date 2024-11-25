const User = require('../models/User.js');
const Client = require("../models/Client.js");
const Driver = require("../models/Driver.js");
const bcrypt = require('bcryptjs');
const notificationController  =require('./notificationController');
const historiqueUtils  =require('./historiqueUtils');

// Get all users
exports.getAllUsers  = async (req, res) => {
    try {
        const { firstName,lastName, role } = req.query;

        let conditions = [];
        if (name) {
            conditions.push({ firstName: firstName });
            conditions.push({ lastName: lastName });
        }
        if (role) {
            conditions.push({ userType: role });
        }

        const users = conditions.length === 0 ? await User.find({}) : await User.find({ $or: conditions });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.getAllUsersForAdmin = async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users with specific fields
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};
exports.getAllUsersAndDriversForAdmin = async (socket) => {
  try {
    // Récupérer uniquement les utilisateurs dont le userType est Driver
    const drivers = await User.find({ userType: 'Driver' }, 'firstName lastName pushToken');

    // Récupérer uniquement les utilisateurs dont le userType est Client
    const clients = await User.find({ userType: 'Client' }, 'firstName lastName pushToken');

    // Créer un Set pour stocker les `pushToken` déjà utilisés (pour éviter les doublons si nécessaire)
    const usedPushTokens = new Set();

    // Formater les données des drivers
    const formattedDrivers = drivers
      .filter(driver => driver.pushToken && !usedPushTokens.has(driver.pushToken))
      .map(driver => {
        usedPushTokens.add(driver.pushToken);
        return {
          id: driver._id,
          name: `${driver.firstName} ${driver.lastName}`,
          pushToken: driver.pushToken,
          userType: 'Driver',
        };
      });

    // Formater les données des clients
    const formattedClients = clients
      .filter(client => client.pushToken && !usedPushTokens.has(client.pushToken))
      .map(client => {
        usedPushTokens.add(client.pushToken);
        return {
          id: client._id,
          name: `${client.firstName} ${client.lastName}`,
          pushToken: client.pushToken,
          userType: 'Client',
        };
      });

    // Émettre la réponse avec les clients et livreurs sans doublons
    socket.emit('responseUsersAndDrivers', { clients: formattedClients, drivers: formattedDrivers });
  } catch (error) {
    // Envoyer une réponse d'erreur détaillée au client
    socket.emit('error', {
      message: 'Erreur lors de la récupération des utilisateurs.',
      details: error.message,
    });
  }
};




// Get a user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

// Create a new user
exports.createUser = async (req, res) => {
    try {
        const { firstName, lastName, phone , UserType} = req.body;
        const newUser = new User({ firstName, lastName, phone  , UserType});
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
};
exports.isUserValid = (newUser) => {
    let errorList = [];
    if (!newUser.firstName) errorList.push("Please enter first name");
    if (!newUser.lastName) errorList.push("Please enter last name");
    if (!newUser.phone) errorList.push("Please enter phone");
  
  

    return errorList.length > 0 ? { status: false, errors: errorList } : { status: true };
}
exports.saveUser = async (req, res) => {
    const newUser = req.body;
    const userValidStatus = isUserValid(newUser);

    if (!userValidStatus.status) {
        return res.status(400).json({ message: 'error', errors: userValidStatus.errors });
    }

    try {
        const user_idetails = await User.create({
            phone: newUser.phone,
        
            firstName: newUser.firstName,
            lastName: newUser.lastName,
           
            userType: newUser.userType,
            activated: false
        });

        if (newUser.userType === "Driver") {
            await Driver.create({
                user_id: user_idetails._id,
                additional_client_info: newUser.firstName+" "+newUser.lastName+""+newUser.phone,
                
            });
        } else if (newUser.userType === "Client") {
            await Client.create({
                user_id: user_idetails._id,
                additional_client_info: newUser.firstName+" "+newUser.lastName+""+newUser.phone,
            });
        }
        res.status(201).json({ message: "success" });
    } catch (error) {
        res.status(400).json({ message: "error", errors: [error.message] });
    }
}

// Update a user
exports.updateUser = async (req, res) => {
    const newUser = req.body;
    const userValidStatus = isUserValid(newUser);

    if (!userValidStatus.status) {
        return res.status(400).json({ message: 'error', errors: userValidStatus.errors });
    }

    try {
        await User.updateOne({ _id: req.params.id }, { $set: req.body });
        res.status(201).json({ message: 'success' });
    } catch (error) {
        res.status(400).json({ message: 'error', errors: [error.message] });
    }
}

// Delete a user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user.userType === 'Driver') {
            await Driver.deleteOne({ user_id: req.params.id });
        } else if (user.userType === 'Client') {
            await Client.deleteOne({ user_id: req.params.id });
        }

        await User.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'success' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// activateUser , 
exports.getActivatedStatus = async (user_id) => {
    try {
        const user = await User.findById(user_id);
        if (!user) throw new Error("Utilisateur introuvable");

        return { activated: user.activated };
    } catch (error) {
        throw error;
    }
}

exports.editActivatedStatus = async (user_id, newActivatedStatus) => {
    try {
        const user = await User.findById(user_id);
        if (!user) throw new Error("Utilisateur introuvable");

     
        await User.findByIdAndUpdate(
          user_id,
          { activated: newActivatedStatus },
         
        );

        const { io } = require('../index');

        await this.watchActivition(io) ;
        return { message: "Statut 'activated' mis à jour avec succès" };
    } catch (error) {
        throw error;
    }
}


exports.loginUser = async (req, res) => {
  try {
    const { deviceId, phone, password ,location } = req.body;

    // Check if the required fields are provided
    if (!deviceId || !phone || !password || !location) {
      return res.status(400).json({ message: 'Please provide deviceId, phone, and password.' });
    }

    // Find the user by deviceId and phone
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: ' invalid phone' });
    }
if (user.userType !== 'Driver') {
      return res.status(404).json({ message: 'compte introubable' });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password.' });
    }  

    if (user.deviceId !== deviceId) {
      user.deviceId=deviceId;
      user.isLogin = true; // Set login status to true
      user.activated = false; // Set login status to true
      await user.save(); 
      const { io } = require('../index');

      await this.watchActivition(io) ;

      const username = user.lastName + ' ' + user.firstName;
      const targetScreen = ' Notifications';
      const title = '🚨🔐 Changement de dispositif détecté!🔑🚨';
      const messageBody = `🚚 Le livreur a changé d'appareil ou réinstallé l'application.\n\n🔐 Une nouvelle activation est nécessaire pour continuer.`;
  
      await notificationController.sendNotificationAdmin(username,targetScreen,messageBody ,title);
   
      historiqueUtils.enregistrerAction({
        actionType: 'ConnexionReset',
        description:  user.lastName + ' ' + user.firstName+'👤 Le livreur a changé d appareil ou réinstallé l application.\n\n🔑',
        utilisateurId: user._id, // Remplacez par un ID valide
        objetType: 'Driver',
        location: location
    });
      return res.status(401).json({ message: 'attendez l\'activation par l\'admin' });
    }

    // If password matches, return success message
    user.isLogin = true; // Set login status to true
    await user.save();    // Save the updated login status
   
    const username = user.lastName + ' ' + user.firstName;
    const targetScreen = ' Notifications';
    const title = '🔔 Nouvelle Connexion de Livreur🚚  ';
    const messageBody = `🚚 Livreur vient de se connecter.\n\n🔑 Veuillez vérifier les détails de la connexion.`;
    const userType = 'Driver';

    await notificationController.sendNotificationAdmin(username,targetScreen,messageBody ,title);
 
    historiqueUtils.enregistrerAction({
      actionType: 'Connexion',
      description:  user.lastName + ' ' + user.firstName+'👤 vient de se connecter.\n\n🔑',
      utilisateurId: user._id, // Remplacez par un ID valide
      objetType: 'Driver',
      location: location

  });
    return res.status(200).json({
      message: 'Login successful',
      data: {
        deviceId: user.deviceId,
        phone: user.phone,
        userType: user.userType,
        activated: user.activated,
        isLogin: user.isLogin,
      },
    });

  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

 exports.updateUserPoints = async (req, res) => {
    const { userId, newPoints } = req.body;

    // Log the incoming request body for debugging
    console.log('Received userId:', userId);
    console.log('Received newPoints:', newPoints);

    try {
        // Log the start of the user update process
        console.log('Attempting to find user and update points');
const client = await Client.findById(userId);
if (!client) {
    return res.status(404).json({ message: "Client not found" });
}
        // Find the user by ID and update their points
        const updatedUser = await User.findByIdAndUpdate(
            client.user_id, 
            { points_earned: newPoints }, 
            { new: true } // Return the updated document
        );

        // Log the updated user details for debugging
        console.log('Updated User:', updatedUser);

        if (!updatedUser) {
            console.log('User not found');
            return res.status(404).json({ message: "User not found" });
        }

        // Success log
        console.log('Points updated successfully for user:', client.user_id);

        return res.status(200).json({
            message: "Points updated successfully",
            user: updatedUser
        });
    } catch (error) {
        // Log the error message for debugging
        console.error('Error updating points:', error);

        return res.status(500).json({ message: "Error updating points", error });
    }
};



exports.validatePass = async (req, res) => {
    const { id, currentPassword } = req.body;
  
    try {
      // Fetch the user by userId from the database
      const client = await Client.findById(id);
      const user = await User.findById(client.user_id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Compare the provided password (currentPassword) with the stored hashed password
      const isValid = await bcrypt.compare(currentPassword, user.password); // Assuming 'password' is the field for hashed password
  
      if (isValid) {
        res.json({ isValid: true });
      } else {
        res.json({ isValid: false, message: 'Invalid password' });
      }
    } catch (error) {
      console.error('Error validating password:', error);
      res.status(500).json({ message: 'Error validating password', error });
    }
  };

  exports.changeNumber = async (req, res) => {
    const { phoneNumber,id } = req.body;
    console.log("ffffff",phoneNumber,id)
  
    try { 
      const client = await Client.findById(id);
      const user = await User.findById(client.user_id);
      const oldNumber =  user.phone;
      console.log(oldNumber,"hhhhhh")
      // Find the user by ID and update their phone number
      const updatedUser = await User.findByIdAndUpdate(
        user._id, 
        { phone: phoneNumber }, 
        { new: true } // Return the updated document after the update
      );
     
  
      if (!updatedUser || !user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const username = user.lastName + ' ' + user.firstName;
      const targetScreen = ' Notifications';
      const messageBody = `vient de changer son numero de ${oldNumber} vers ${phoneNumber}`;
      const title = ' Changemment de numero de telephone';
   
      await notificationController.sendNotificationAdmin(username,targetScreen,messageBody ,title);
   
   
      return res.status(200).json({
        message: 'Phone number updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error updating phone number', error });
    }
  };



exports.changePass = async (req, res) => {
  const { id, newPassword } = req.body;

  try {
    console.log("newPassword",newPassword)
    console.log("id",id)
    // Hash the new password
    const salt = await bcrypt.genSalt(10); // Generates a salt with 10 rounds
    const hashedPassword = await bcrypt.hash(newPassword, salt);
const client = await Client.findById(id);
    // Find the user by ID and update their password
    const updatedUser = await User.findByIdAndUpdate(
      client.user_id,
      { password: hashedPassword }, // Update the password field with the hashed password
      { new: true } // Return the updated document after the update
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Password updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating password', error });
  }
};


exports.changeName = async (req, res) => {
  const { id, firstName, lastName } = req.body;

  try {
    const client = await Client.findById(id);
    const userCli = await User.findById(client.user_id);
    if (!userCli) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = await User.findByIdAndUpdate(client.user_id, { firstName, lastName }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const username = user.lastName + ' ' + user.firstName;
    const oldusername = userCli.lastName + ' ' + userCli.firstName;
    const targetScreen = ' Notifications';
    const messageBody = ` vient de changer son nom de ${oldusername} vers ${username}`;
    const title = ' Changemment de Nom de Client';
 
    await notificationController.sendNotificationAdmin(oldusername,targetScreen,messageBody ,title);
 
 
    res.status(200).json({ message: 'Name updated successfully', user });

  } catch (error) {
    res.status(500).json({ message: 'Failed to update name', error });
  }
};

// Get all users that are clients
exports.getClients = async (req, res) => {
  console.log('Received request to fetch clients');  // Log that the request was received

  try {
    // Fetch only users where userType is 'Client'
    const clients = await User.find({ userType: 'Client' });

    if (clients.length === 0) {
      console.log('No clients found');  // Log if no clients are found
      return res.status(404).json({ message: 'No clients found' });
    }

    console.log('Clients retrieved successfully:', clients.length);  // Log how many clients were found
    res.status(200).json(clients);  // Send the clients back in response
  } catch (error) {
    console.error('Error fetching clients:', error);  // Log any errors
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
};


exports.activateDeactivateClient = async ( io,clientId , isActive,deviceId) => {

  try {
    console.log('Received request to activate/deactivate client:', clientId, isActive);
    const client = await User.findByIdAndUpdate(clientId, { activated: isActive }, { new: true });
    if (!client) {
      io.emit('error', { message: 'Client not found' });
      return;
    }

    // Notify the specific client of the activation/deactivation
    if (isActive) {
      io.to(deviceId).emit('adminActivateClient');  // Emit only to the specific client
    } else {
      io.to(deviceId).emit('adminDeactivateClient');  // Emit only to the specific client
    }

    // Optionally, notify all clients about the update
    const clients = await User.find({ userType: 'Client' });
    io.emit('clientsUpdated', { clients });

    // Notify the admin that the operation was successful
    io.emit('operationSuccess', `Client ${isActive ? 'activated' : 'deactivated'} successfully.`);
    await this.watchActivition(io) ;
  } catch (error) {
    console.error('Error activating/deactivating client:', error);
    io.emit('error', { message: 'Error updating client activation status' });
  }
};




exports.watchActivition = async ( socket) => {

  try {
    // Check if there are inactive clients
    const inactiveClients = await User.exists({ userType: 'Client', activated: false });
    // Check if there are inactive drivers
    const inactiveDrivers = await User.exists({ userType: 'Driver', activated: false });

    // Construct the status object based on the query results
    const status = {
      clients: !!inactiveClients, // true if at least one client is inactive
      drivers: !!inactiveDrivers  // true if at least one driver is inactive
    };

    // Emit the status back to the client
    socket.emit("activationStatus", status);
  } catch (error) {
    console.error("Error checking activation status:", error);
    // Optionally emit an error message to the client
    socket.emit("error", "Failed to check activation status");
  }
};






// Controller to toggle isLogin status of a client
exports.toggleLoginStatus = async (io,clientId,deviceId) => {
  // Get client ID from the route parameters

  try {
    const client = await User.findById(clientId);

    if (!client) {
      io.emit('error', { message: 'Client not found' });
      return;
    }

    client.isLogin = !client.isLogin;
    await client.save();

    // Notify the specific client of the login status change
    if (client.isLogin) {
      io.to(deviceId).emit('adminActivateClient');  // Emit only to the specific client
    } else {
      io.to(deviceId).emit('adminDeactivateClient');  // Emit only to the specific client
    }

    // Optionally, notify all clients about the update
    const clients = await User.find({ userType: 'Client' });
    io.emit('clientsUpdated', { clients });

    // Notify the admin that the operation was successful
    io.emit('operationSuccess', `Client login status changed successfully.`);
  } catch (error) {
    console.error('Error toggling login status:', error);
    io.emit('error', { message: 'Error toggling login status' });
  }

};


// Get all users that are clients
exports.getDrivers = async (req, res) => {
  console.log('Received request to fetch clients');  // Log that the request was received

  try {
    // Fetch only users where userType is 'Client'
    const clients = await User.find({ userType: 'Driver' });

    if (clients.length === 0) {
      console.log('No clients found');  // Log if no clients are found
      return res.status(404).json({ message: 'No clients found' });
    }

    console.log('Clients retrieved successfully:', clients.length);  // Log how many clients were found
    res.status(200).json(clients);  // Send the clients back in response
  } catch (error) {
    console.error('Error fetching clients:', error);  // Log any errors
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
};


exports.activateDeactivateDriver = async  (io, driverId, isActive, deviceId) => {
  try {
    console.log('Received request to activate/deactivate driver:', driverId, isActive);
    const driver = await User.findByIdAndUpdate(driverId, { activated: isActive }, { new: true });

    if (!driver) {
      io.to(deviceId).emit('error', { message: 'Driver not found' });
      return;
    }

    // Notify the specific driver of the activation/deactivation
    if (isActive) {
      io.to(deviceId).emit('adminActivateDriver');  // Emit only to the specific driver
    } else {
      io.to(deviceId).emit('adminDeactivateDriver');  // Emit only to the specific driver
    }

    // Optionally, notify all drivers about the update
    const drivers = await User.find({ userType: 'Driver' });
    io.emit('driversUpdated', { drivers });

    // Notify the admin that the operation was successful
    io.emit('operationSuccess', `Driver ${isActive ? 'activated' : 'deactivated'} successfully.`);
    await this.watchActivition(io) ;
  } catch (error) {
    console.error('Error activating/deactivating driver:', error);
    io.to(deviceId).emit('error', { message: 'Error updating driver activation status' });
  }
};






// Controller to toggle isLogin status of a client
exports.toggleLoginStatusD = async (io, driverId)=> {
  try {
    const driver = await User.findById(driverId);

    if (!driver) {
      io.emit('error', { message: 'Driver not found' });
      return;
    }

    driver.isLogin = !driver.isLogin;
    await driver.save();

    // Notify the specific driver about the login status change
    if (driver.isLogin) {
      io.to(driver.deviceId).emit('adminActivateDriver');  // Emit only to the specific driver
    } else {
      io.to(driver.deviceId).emit('adminDeactivateDriver');  // Emit only to the specific driver
    }

    // Optionally, notify all drivers about the update
    const drivers = await User.find({ userType: 'Driver' });
    io.emit('driversUpdated', { drivers });

    // Notify the admin that the operation was successful
    io.emit('operationSuccess', `Driver login status changed successfully.`);
  } catch (error) {
    console.error('Error toggling driver login status:', error);
    io.emit('error', { message: 'Error toggling driver login status' });
  }
};



exports.updateTheDriver = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, deviceId, phone, password, points_earned, userType, activated, isLogin } = req.body;

  try {
    let updatedData = { firstName, lastName, deviceId, phone, points_earned, userType, activated, isLogin };

    // If password is provided and not just spaces, hash it before updating
    if (password && password.trim() !== "") {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updatedData.password = hashedPassword;
    }

    // Find driver by ID and update with new data
    const updatedDriver = await User.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.status(200).json({ message: 'Driver updated successfully', updatedDriver });
    const { io } = require('../index');

    const drivers = await User.find({ userType: 'Driver' });
    io.emit('driversUpdated', { drivers });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: `Duplicate field error: ${Object.keys(error.keyValue).join(', ')} already exists.`,
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: Object.values(error.errors).map((err) => err.message).join(', '),
      });
    }

    res.status(500).json({ message: 'An error occurred while updating the driver' });
  }
};


// Function to create a new user and driver
exports.addDriver = async (req, res) => {
  try {
    const { firstName, lastName, deviceId, phone, password, points_earned, userType, activated, isLogin } = req.body;

    // Check if user type is 'Driver'
    if (userType !== 'Driver') {
      return res.status(400).json({ message: 'User type must be Driver.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      deviceId,
      phone,
      password: hashedPassword,
      points_earned,
      userType,
      activated,
      isLogin,
    });

    // Save the new user
    const savedUser = await newUser.save();

    // After creating the user, create a new driver entry with the user's ID
    const newDriver = new Driver({
      user_id: savedUser._id,
      isDisponible: false, // Assuming driver is available when created
    });

    // Save the new driver
    await newDriver.save();
    
    const { io } = require('../index');
    const drivers = await User.find({userType : 'Driver'});
    io.emit('driversUpdated', { drivers });

    const username = newUser.lastName + ' ' + newUser.firstName;
    const targetScreen = ' Notifications';
    const messageBody = ' est inscrit sur l\'application';
    const title = ' Nouvelle inscription';

    await notificationController.sendNotificationAdmin(username,targetScreen,messageBody ,title);
    // Return success response
    res.status(201).json({ message: 'Driver and user created successfully.', user: savedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error. Could not create user and driver.' });
  }
};