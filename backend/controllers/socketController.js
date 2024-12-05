const User = require('../models/User'); // Your User model
const Admin = require('../models/Admin'); // Your Admin model
const Driver = require('../models/Driver'); // Your Driver model
const Order = require('../models/Order'); // Your Order model
// Emit the current status of system, clients, and drivers
const emitInitialStatus = async (socket) => {
  try {
    const admin = await Admin.findOne();
    const clientsActive = await User.findOne({ userType: 'Client', activated: true });
    const driversActive = await User.findOne({ userType: 'Driver', activated: true });

    const systemActive = admin ? admin.isSystem : false;

    socket.emit('statusSite', {
      systemActive,
      clientsActive: !!clientsActive,
      driversActive: !!driversActive,
      actuTranche:  admin ? admin.actuTranche : "none",
      MAX_TRANCHE:  admin ? admin.MAX_TRANCHE : "none",
    });
  } catch (error) {
    console.error('Error emitting initial status:', error);
  }
};
const applyTranches = async (socket, data) => {
  try {
    // Déstructuration des nouvelles valeurs
    const { maxTranche, actuTranche } = data;

    // Trouver l'admin dans la base de données
    const admin = await Admin.findOne();
    const clientsActive = await User.findOne({ userType: 'Client', activated: true });
    const driversActive = await User.findOne({ userType: 'Driver', activated: true });

    const systemActive = admin ? admin.isSystem : false;

    if (admin) {
      // Mise à jour des valeurs dans la base de données
      admin.MAX_TRANCHE = maxTranche;
      admin.actuTranche = actuTranche;
      
      // Sauvegarde de l'admin mis à jour dans la base de données
      await admin.save();
      
      // Envoi des nouvelles valeurs via Socket.IO
      socket.emit('statusSite', {
        systemActive,
        clientsActive: !!clientsActive,
        driversActive: !!driversActive,
        MAX_TRANCHE: admin.MAX_TRANCHE,
        actuTranche: admin.actuTranche,
      });

      console.log('Tranches mises à jour avec succès.');
    } else {
      console.error('Admin non trouvé.');
      socket.emit('statusSite', {
        error: 'Admin non trouvé'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des tranches:', error);
    socket.emit('statusSite', {
      error: 'Erreur de mise à jour'
    });
  }
};


// Toggle the system's active status
const toggleSystemStatus = async (data, io) => {
  try {
    const admin = await Admin.findOne();

    if (admin) {
      admin.isSystem = data;
      await admin.save();
    } else {
      // Create a new admin record if not exists (optional)
      await Admin.create({ isSystem: data });
    }

    const clientsActive = await User.findOne({ userType: 'Client', activated: true });
    const driversActive = await User.findOne({ userType: 'Driver', activated: true });

    io.emit('statusSite', {
      systemActive: data,
      clientsActive: !!clientsActive,
      driversActive: !!driversActive,
      MAX_TRANCHE: admin.MAX_TRANCHE,
      actuTranche: admin.actuTranche,
    });


    const admin0 = await Admin.findOne();
   
    const systemActive = admin0 ? admin0.isSystem : false;

 
    io.emit('statusSiteDriver', 
        systemActive,
    
    );
  } catch (error) {
    console.error('Error toggling system status:', error);
  }
};
const toggleSystemStatusForDriver = async ( io) => {
  try {
    const admin = await Admin.findOne();
   
    const systemActive = admin ? admin.isSystem : false;

 
    io.emit('statusSiteDriver', 
        systemActive,
    
    );
  } catch (error) {
    console.error('Error toggling system status:', error);
  }
};

// Toggle all clients' active status
const toggleClientsStatus = async (data, io) => {
  try {
    await User.updateMany({ userType: 'Client' }, { activated: data });
    if(!data){
        io.emit('adminDeactivateClient', );

    }else{
        io.emit('adminActivateClient');  // Emit only to the specific client
    }

    const clientsActive = await User.findOne({ userType: 'Client', activated: true });
    const driversActive = await User.findOne({ userType: 'Driver', activated: true });
    const admin = await Admin.findOne();

    io.emit('statusSite', {
      systemActive: admin ? admin.isSystem : false,
      clientsActive: !!clientsActive,
      driversActive: !!driversActive,
      MAX_TRANCHE: admin.MAX_TRANCHE,
      actuTranche: admin.actuTranche,
    });
  } catch (error) {
    console.error('Error toggling clients status:', error);
  }
};

// Toggle all drivers' active status
const toggleDriversStatus = async (data, io) => {
    try {
      // Toggle the activation status of all drivers
      await User.updateMany({ userType: 'Driver' }, { activated: data });
  
      if (!data) {
        // Deactivate pending and in-progress orders
        await Order.updateMany(
          { status: { $in: ["pending", "in_progress"] } }, 
          { status: "cancelled", active: false }
        );
        
        // Mark all drivers as unavailable and reset their order count
        await Driver.updateMany({ isDisponible: true }, { isDisponible: data, orders_count: 0 });
  
        // Emit the event that all drivers have been deactivated
        io.emit('adminDeactivateDriver', {
          message: 'All drivers have been deactivated. Orders in progress were cancelled.'
        });
  
      } else {
        // Emit the event that all drivers have been activated
        io.emit('adminActivateDriver', {
          message: 'All drivers have been activated and are available for orders.'
        });
      }
  
      // Emit the current system status
      const clientsActive = await User.findOne({ userType: 'Client', activated: true });
      const driversActive = await User.findOne({ userType: 'Driver', activated: true });
      const admin = await Admin.findOne();
  
      io.emit('statusSite', {
        systemActive: admin ? admin.isSystem : false,
        clientsActive: !!clientsActive,
        driversActive: !!driversActive,
        MAX_TRANCHE: admin.MAX_TRANCHE,
        actuTranche: admin.actuTranche,
      
      });
  
    } catch (error) {
      console.error('Error toggling drivers status:', error);
      // You may also want to emit an error message to clients if necessary
      io.emit('error', { message: 'Failed to toggle driver status. Please try again.' });
    }
  };
  

module.exports = {
  emitInitialStatus,
  applyTranches,
  toggleSystemStatus,
  toggleClientsStatus,
  toggleSystemStatusForDriver,
  toggleDriversStatus,
};
