const User = require('../models/User.js');
const Client = require("../models/Client.js");
const Driver = require("../models/Driver.js");
const bcrypt = require('bcryptjs');
const sendNotificationAdmin  =require('./notificationController');
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


        return { message: "Statut 'activated' mis à jour avec succès" };
    } catch (error) {
        throw error;
    }
}


exports.loginUser = async (req, res) => {
  try {
    const { deviceId, phone, password } = req.body;

    // Check if the required fields are provided
    if (!deviceId || !phone || !password) {
      return res.status(400).json({ message: 'Please provide deviceId, phone, and password.' });
    }

    // Find the user by deviceId and phone
    const user = await User.findOne({ deviceId, phone });

    if (!user) {
      return res.status(404).json({ message: 'Invalid deviceId or phone.' });
    }
if (user.userType !== 'Driver') {
      return res.status(404).json({ message: 'compte introubable' });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    // If password matches, return success message
    user.isLogin = true; // Set login status to true
    await user.save();    // Save the updated login status
    const username = user.lastName + ' ' + user.firstName;
    const targetScreen = ' Notifications';
    const messageBody = ' vient de se connecter';
    const title = ' Nouvelle Connexion de livreur';

    await sendNotificationAdmin(username,targetScreen,messageBody ,title);
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

        // Find the user by ID and update their points
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
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
        console.log('Points updated successfully for user:', userId);

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
      const user = await User.findById(id);
      
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
    const { id, phoneNumber } = req.body;
  
    try { 
      const user = await User.findOne(id);
      const oldNumber = user.phone;
      // Find the user by ID and update their phone number
      const updatedUser = await User.findByIdAndUpdate(
        id, 
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
   
      await sendNotificationAdmin(username,targetScreen,messageBody ,title);
   
   
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
    // Hash the new password
    const salt = await bcrypt.genSalt(10); // Generates a salt with 10 rounds
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Find the user by ID and update their password
    const updatedUser = await User.findByIdAndUpdate(
      id,
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


exports.activateDeactivateClient = async (req, res) => {
  const { clientId } = req.params;  // Get client ID from the route parameters
  const { isActive } = req.body;  // Get activation status from the request body

  try {
    // Find the client by ID and update the "activated" status
    const client = await User.findByIdAndUpdate(clientId, { activated: isActive }, { new: true });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Respond with the updated client information
    res.status(200).json({ message: `Client ${isActive ? 'activated' : 'deactivated'}`, client });
  } catch (error) {
    console.error('Error activating/deactivating client:', error);
    res.status(500).json({ message: 'Error updating client activation status', error: error.message });
  }
};






// Controller to toggle isLogin status of a client
exports.toggleLoginStatus = async (req, res) => {
  const { clientId } = req.params;  // Get client ID from the route parameters

  try {
    // Find the client by ID
    const client = await User.findById(clientId);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Toggle the isLogin status
    client.isLogin = !client.isLogin;

    // Save the updated client
    await client.save();

    // Respond with the updated client information
    res.status(200).json({ message: `Client is now ${client.isLogin ? 'logged in' : 'logged out'}`, client });
  } catch (error) {
    console.error('Error toggling login status:', error);
    res.status(500).json({ message: 'Error toggling login status', error: error.message });
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


exports.activateDeactivateDriver = async (req, res) => {
  const { clientId } = req.params;  // Get client ID from the route parameters
  const { isActive } = req.body;  // Get activation status from the request body

  try {
    // Find the client by ID and update the "activated" status
    const client = await User.findByIdAndUpdate(clientId, { activated: isActive }, { new: true });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Respond with the updated client information
    res.status(200).json({ message: `Client ${isActive ? 'activated' : 'deactivated'}`, client });
  } catch (error) {
    console.error('Error activating/deactivating client:', error);
    res.status(500).json({ message: 'Error updating client activation status', error: error.message });
  }
};






// Controller to toggle isLogin status of a client
exports.toggleLoginStatusD = async (req, res) => {
  const { clientId } = req.params;  // Get client ID from the route parameters

  try {
    // Find the client by ID
    const client = await User.findById(clientId);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Toggle the isLogin status
    client.isLogin = !client.isLogin;

    // Save the updated client
    await client.save();

    // Respond with the updated client information
    res.status(200).json({ message: `Client is now ${client.isLogin ? 'logged in' : 'logged out'}`, client });
  } catch (error) {
    console.error('Error toggling login status:', error);
    res.status(500).json({ message: 'Error toggling login status', error: error.message });
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
      isDisponible: true, // Assuming driver is available when created
    });

    // Save the new driver
    await newDriver.save();
    const username = newUser.lastName + ' ' + newUser.firstName;
    const targetScreen = ' Notifications';
    const messageBody = ' est inscrit sur l\'application';
    const title = ' Nouvelle inscription';

    await sendNotificationAdmin(username,targetScreen,messageBody ,title);
    // Return success response
    res.status(201).json({ message: 'Driver and user created successfully.', user: savedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error. Could not create user and driver.' });
  }
};