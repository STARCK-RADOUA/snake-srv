const User = require("../models/User.js");
const Client = require("../models/Client.js");
const Driver = require("../models/Driver.js");

const getUsers = async (req, res) => {
    try {
        const { name, role } = req.query;

        let conditions = [];
        if (name) {
            conditions.push({ firstName: name });
            conditions.push({ lastName: name });
        }
        if (role) {
            conditions.push({ UserType: role });
        }

        const Users = conditions.length === 0 ? await User.find({}) : await User.find({ $or: conditions });

        res.json(Users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getUserById = async (req, res) => {
    try {
        const User = await User.findById(req.params.id);
        res.json(User);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

const isUserValid = (newUser) => {
    let errorList = [];
    if (!newUser.firstName) errorList.push("Please enter first name");
    if (!newUser.lastName) errorList.push("Please enter last name");
    if (!newUser.email) errorList.push("Please enter email");
    if (!newUser.password) errorList.push("Please enter password");
    if (!newUser.confirmPassword) errorList.push("Please re-enter password in Confirm Password field");
    if (!newUser.UserType) errorList.push("Please enter User Type");
    if (newUser.password !== newUser.confirmPassword) errorList.push("Password and Confirm Password did not match");

    return errorList.length > 0 ? { status: false, errors: errorList } : { status: true };
}

const saveUser = async (req, res) => {
    const newUser = req.body;
    const UserValidStatus = isUserValid(newUser);

    if (!UserValidStatus.status) {
        return res.status(400).json({ message: 'error', errors: UserValidStatus.errors });
    }

    try {
        const UserDetails = await User.create({
            email: newUser.email,
            Username: newUser.Username,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            password: newUser.password,
            UserType: newUser.UserType,
            activated: true
        });

        if (newUser.UserType === "Driver") {
            await Driver.create({
                User_id: UserDetails._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email
            });
        } else if (newUser.UserType === "Client") {
            await Client.create({
                User_id: UserDetails._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email
            });
        }
        res.status(201).json({ message: "success" });
    } catch (error) {
        res.status(400).json({ message: "error", errors: [error.message] });
    }
}

const updateUser = async (req, res) => {
    const newUser = req.body;
    const UserValidStatus = isUserValid(newUser);

    if (!UserValidStatus.status) {
        return res.status(400).json({ message: 'error', errors: UserValidStatus.errors });
    }

    try {
        await User.updateOne({ _id: req.params.id }, { $set: req.body });
        res.status(201).json({ message: 'success' });
    } catch (error) {
        res.status(400).json({ message: 'error', errors: [error.message] });
    }
}

const deleteUser = async (req, res) => {
    try {
        const User = await User.findById(req.params.id);

        if (User.UserType === 'Driver') {
            await Driver.deleteOne({ User_id: req.params.id });
        } else if (User.UserType === 'Client') {
            await Client.deleteOne({ User_id: req.params.id });
        }

        await User.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'success' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const getActivatedStatus = async (User_id) => {
    try {
        const User = await User.findById(User_id);
        if (!User) throw new Error("Utilisateur introuvable");

        return { activated: User.activated };
    } catch (error) {
        throw error;
    }
}

const editActivatedStatus = async (User_id, newActivatedStatus) => {
    try {
        const User = await User.findById(User_id);
        if (!User) throw new Error("Utilisateur introuvable");

     
        const updatedDepartement = await User.findByIdAndUpdate(
          User_id,
          { activated: newActivatedStatus },
         
        );




        

        return { message: "Statut 'activated' mis à jour avec succès" };
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getUsers,
    getUserById,
    saveUser,
    updateUser,
    deleteUser,
    getActivatedStatus,
    editActivatedStatus
}
