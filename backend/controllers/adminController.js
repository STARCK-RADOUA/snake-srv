const Admin = require('../models/Admin');
const User = require('../models/User');

// Get all admins
exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().populate('user_id');
        res.status(200).json(admins);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
};

const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');  // Pour générer un mot de passe temporaire

exports.loginUser = async (req, res) => {
  try {
    const { deviceId, phone, password } = req.body;

    if (!deviceId || !phone || !password) {
      return res.status(400).json({ message: 'Please provide deviceId, phone, and password.' });
    }

    // Find the user by phone
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: 'Invalid phone number.' });
    }

    if (user.userType !== 'Admin') {
      return res.status(404).json({ message: 'Compte introuvable.' });
    }

    // Check if the deviceId matches
    if (user.deviceId !== deviceId) {
      // Generate a new password
      const newPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password and deviceId
      user.password = hashedPassword;
      user.deviceId = deviceId;
      await user.save();

      // Send an email with the new password
      const transporter = nodemailer.createTransport({
        service: 'Gmail', // ou un autre service de messagerie
        auth: {
          user: 'alrahma.hopitale@gmail.com', // Votre email
          pass: 'gqydcptswlbrazda', // Votre mot de passe
        },
      });

      const mailOptions = {
        from: 'alrahma.hopitale@gmail.com',
        to: user.email, // L'adresse email de l'utilisateur
        subject: 'Nouveau mot de passe pour votre compte administrateur',
        text: `Bonjour,\n\nVotre mot de passe a été réinitialisé en raison d'une connexion depuis un nouvel appareil. Votre nouveau mot de passe est : ${newPassword}\n\nMerci de le changer après vous être connecté.\n\nCordialement, L'équipe`,
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        message: 'Nouveau mot de passe envoyé à votre adresse e-mail en raison d’un changement d’appareil.',
      });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    // If password matches, return success message
    user.isLogin = true; // Set login status to true
    await user.save(); // Save the updated login status

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

// Get an admin by ID
exports.getAdminById = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).populate('user_id');
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        res.status(200).json(admin);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admin' });
    }
};

// Create a new admin
exports.createAdmin = async (req, res) => {
    try {
        const { user_id, additional_admin_info } = req.body;
        const user = await User.findById(user_id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newAdmin = new Admin({ user_id, additional_admin_info });
        await newAdmin.save();
        res.status(201).json(newAdmin);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create admin' });
    }
};

// Update an admin
exports.updateAdmin = async (req, res) => {
    try {
        const { additional_admin_info } = req.body;
        const admin = await Admin.findByIdAndUpdate(req.params.id, { additional_admin_info }, { new: true });

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        res.status(200).json(admin);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update admin' });
    }
};

// Delete an admin
exports.deleteAdmin = async (req, res) => {
    try {
        const admin = await Admin.findByIdAndDelete(req.params.id);
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete admin' });
    }
};
