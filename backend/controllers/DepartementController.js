const Departement = require("../models/Departement");

exports.createDepartement = async (req, res) => {
  try {
    const { name, description , imageUrls } = req.body;
    const newDepartement = await Departement.create({ name, description , imageUrls });
    res.status(201).json({ message: "success" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllDepartements = async (req, res) => {
  try {
    const departements = await Departement.find();
    res.status(200).json(departements);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getDepartementById = async (req, res) => {
  try {
    const departement = await Departement.findById(req.params.id);
    if (!departement) {
      return res.status(404).json({ message: "Departement not found" });
    }
    res.status(200).json(departement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateDepartement = async (req, res) => {
  try {
    const { name, description } = req.body;
    const updatedDepartement = await Departement.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    if (!updatedDepartement) {
      return res.status(404).json({ message: "Departement not found" });
    }
    res.status(201).json({ message: "success" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteDepartement = async (req, res) => {
  try {
    const deletedDepartement = await Departement.findByIdAndDelete(
      req.params.id
    );
    if (!deletedDepartement) {
      return res.status(404).json({ message: "Departement not found" });
    }
    res.status(200).json({ message: "Departement deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
