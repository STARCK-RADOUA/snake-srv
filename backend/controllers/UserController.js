const User = require('../models/User');
const Client = require("../models/Client.js");
const Driver = require("../models/Driver.js");
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
        const userDetails = await User.create({
            phone: newUser.phone,
        
            firstName: newUser.firstName,
            lastName: newUser.lastName,
           
            userType: newUser.userType,
            activated: false
        });

        if (newUser.userType === "Driver") {
            await Driver.create({
                user_id: userDetails._id,
                additional_client_info: newUser.firstName+" "+newUser.lastName+""+newUser.phone,
                
            });
        } else if (newUser.userType === "Client") {
            await Client.create({
                user_id: userDetails._id,
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
