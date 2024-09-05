const Admin = require('../models/Admin');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); 
// Get all admins
exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().populate('user_id');
        res.status(200).json(admins);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
};

 // Pour générer un mot de passe temporaire

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
          service: 'Gmail', // or any other email service
          auth: {
            user: 'alrahma.hopitale@gmail.com', // Your email
            pass: 'gqydcptswlbrazda', // Your email password
          },
        });
  
        const mailOptions = {
          from: 'alrahma.hopitale@gmail.com',
          to: user.email, // User's email address
          subject: 'Nouveau mot de passe pour votre compte administrateur',
          text: `Bonjour,\n\nVotre mot de passe a été réinitialisé en raison d'une connexion depuis un nouvel appareil. Votre nouveau mot de passe est : ${newPassword}\n\nMerci de le changer après vous être connecté.\n\nCordialement, L'équipe`,
        };
  
        await transporter.sendMail(mailOptions);
  
        return res.status(2000).json({message: 'Nouveau mot de passe envoyé à votre adresse e-mail en raison d’un changement d’appareil. Veuillez utiliser ce mot de passe pour vous connecter.',
        });
      }
  
      // If deviceId matches, proceed with password comparison
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid password.' });
      }
  
      // If password matches, set login status to true and return success message
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










exports.adminAutoLogin = async (socket, { deviceId }) => {
    try {
        // Find the user in the database using the device ID
        const user = await User.findOne({ deviceId, userType: 'Admin'});

        if (!user) {
            // Si l'utilisateur avec cet ID de l'appareil n'est pas trouvé
            socket.emit('adminloginFailure', { message: 'Device ID not found' });
            return;
        }

        if (user.activated === false) {
            // Si le compte de l'utilisateur est désactivé
            socket.emit('adminloginFailure', { message: 'User account is disabled' });
            return;
        }   
        if (user.userType !== "Admin") {
            // Si le compte de l'utilisateur est désactivé
            socket.emit('adminloginFailure', { message: 'User account is not admin' });
            return;
        }  
        if (user.isLogin == false) {
            // Si le compte de l'utilisateur est désactivé
            socket.emit('adminloginFailure', { message: 'User account is logout' });
            return;
        }

        // Si tout va bien, l'utilisateur est connecté
        socket.emit('adminloginSuccess', { userId: user._id, message: 'Login successful' });

   
    } catch (error) {
        console.error('Error during auto-login:', error);
        socket.emit('adminloginFailure', { message: 'Login failed due to server error.' });
    }
};

exports.adminRestoreLogin = async (socket, { deviceId }) => {
    try {
        // Find any admin user with a valid email
        const user = await User.findOne({ userType: 'Admin', email: { $exists: true, $ne: '' } });

        if (!user) {
            // If no such user exists, notify the client
            socket.emit('adminloginFailure', { message: 'No admin user with a valid email found.' });
            return;
        }

        // Generate a new password
        const newPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password in the database
        user.password = hashedPassword;
        await user.save();

        // Prepare the email content with the user's phone number, email, and the new password
        const mailOptions = {
            from: 'alrahma.hopitale@gmail.com',
            to: user.email, // Admin's email address
            subject: 'Login Details for Your Admin Account',
            text: `Bonjour,\n\nVotre mot de passe a été réinitialisé. Voici vos nouveaux détails de connexion pour votre compte administrateur :\n\nNuméro de téléphone: ${user.phone}\nEmail: ${user.email}\nNouveau mot de passe: ${newPassword}\n\nMerci de sécuriser ces informations et de changer votre mot de passe après la première connexion.\n\nCordialement, L'équipe`,
        };

        // Set up the email transporter
        const transporter = nodemailer.createTransport({
            service: 'Gmail', // or any other email service
            auth: {
                user: 'alrahma.hopitale@gmail.com', // Your email
                pass: 'gqydcptswlbrazda', // Your email password
            },
        });

        // Send the email
        await transporter.sendMail(mailOptions);

        // Notify the client of the successful operation
        socket.emit('adminRestoreSuccess', { userId: user._id, message: 'Login details sent via email.' });

    } catch (error) {
        console.error('Error during admin restore login:', error);
        socket.emit('adminloginFailure', { message: 'Login failed due to server error.' });
    }
};