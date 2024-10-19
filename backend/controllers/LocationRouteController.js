const axios = require('axios');
const Order = require('../models/Order');
const Address = require('../models/Address');
const Driver = require('../models/Driver');
const ClarkeWright = require('./ClarkeWright');
const chalk = require('chalk'); // Utiliser chalk pour les couleurs

async function getOptimizedRoutes(orderId) {
    try {
        const result = await getRouteDetails(orderId);
        const { distance, duration } = result;

        const address = await Address.findById(order.address_id);
        const driver = await Driver.findById(order.driver_id);

        const locations = [
            { lat: driver.location.latitude, lng: driver.location.longitude, driverId: driver._id },
            { lat: address.latitude, lng: address.longitude, driverId: null }
        ];

        const distances = {};
        for (let i = 0; i < locations.length; i++) {
            for (let j = i + 1; j < locations.length; j++) {
                const loc1 = locations[i];
                const loc2 = locations[j];
                const { distance } = await calculateRoute(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
                distances[`${i}-${j}`] = distance;
            }
        }

        const clarkeWright = new ClarkeWright(locations, driver.location, distances);
        const routes = clarkeWright.createRoutes();

        return routes;

    } catch (error) {
        console.error('Erreur lors de l\'optimisation des itinéraires:', error);
        throw new Error('Erreur lors de l\'optimisation des itinéraires.');
    }
}

// Fonction pour calculer la distance et la durée
async function calculateRoute(startLat, startLng, endLat, endLng) {
    const osrmUrl = `http://localhost:5000/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false`;

    try {
        console.log(`Requesting route from ${startLat},${startLng} to ${endLat},${endLng}`);

        const response = await axios.get(osrmUrl,{ timeout: 10000 });
        const data = response.data;
        
        if (data.code === "Ok" && data.routes.length > 0) {
            const route = data.routes[0];
            return {
                distance: route.distance/1000, // en mètres
                duration: route.duration/60  // en secondes
            };
        } else {
            console.error('Error: No valid routes returned.');
            return { error: 'Error retrieving route data.' };         }
    } catch (error) {
        console.error('Error fetching route from OSRM:', error.message);
        return { error: 'Connection or processing error.' };
    }
}

// Fonction du contrôleur pour obtenir les détails de l'itinéraireconst chalk = require('chalk'); // Utiliser chalk pour les couleurs

async function getRouteDetails(orderId) {
    try {
        const order = await Order.findById(orderId).populate('address_id').populate('driver_id');
        
        if (!order) {
            console.error(chalk.red('Error: Order not found'));
            return { error: 'Order not found' };
        }

        const address = await Address.findById(order.address_id);
        const driver = await Driver.findById(order.driver_id);

        if (!address || !driver) {
            console.error(chalk.red('Error: Address or driver not found'));
            return { error: 'Address or driver not found' };
        }

        const startLat = driver.location.latitude;
        const startLng = driver.location.longitude;

        // Séparer la latitude et la longitude à partir de la chaîne "latitude, longitude"
        const [endLat, endLng] = address.localisation.split(',').map(coord => parseFloat(coord.trim()));

        // Vérification des valeurs
        if (isNaN(endLat) || isNaN(endLng)) {
            console.error(chalk.red('Error: Invalid coordinates for address'));
            return { error: 'Invalid coordinates for address' };
        }

        const result = await calculateRoute(startLat, startLng, endLat, endLng);
        return result;

    } catch (error) {
        // Affichage de l'erreur en rouge dans la console
        console.error(chalk.red('Error retrieving route details:', error.message));

        // Retourner un objet d'erreur sans arrêter le serveur
        return { error: 'Error retrieving route details' };
    }
}

async function calculateCumulativeOrderDuration(orderId) {
    try {
      console.log(`Calculating duration for orderId: ${orderId}`);
  
      // 1. Récupérer l'order basé sur l'orderId donné
      const order = await Order.findById(orderId).populate('driver_id');
      if (!order) {
        console.error(chalk.red('Order not foun:', error.message));
        
      }
      console.log(`Order found: ${order._id}, driverId: ${order.driver_id}`);
  
      // 2. Récupérer le driver_id de cette commande
      const driverId = order.driver_id;
      if (!driverId) {
        throw new Error('No driver assigned to this order');
      }
      console.log(`Driver ID: ${driverId}`);
  
      // 3. Récupérer toutes les commandes "in_progress" du driver
      const driverOrders = await Order.find({ driver_id: driverId, status: 'in_progress', active: true });
      console.log(`Found ${driverOrders.length} in-progress orders for the driver.`);
  
      // 4. Calculer la durée pour chaque commande et trier par durée
      let ordersWithDurations = [];
  
      for (let driverOrder of driverOrders) {
        const routeDetails = await getRouteDetails(driverOrder._id);
        console.log(`Order: ${driverOrder._id}, Duration: ${routeDetails.duration}`);
        ordersWithDurations.push({
          order: driverOrder,
          duration: routeDetails.duration
        });
      }
  
      // 5. Trier les commandes par durée (du plus court au plus long)
      ordersWithDurations.sort((a, b) => a.duration - b.duration);
      console.log('Orders sorted by duration:', ordersWithDurations.map(o => ({ orderId: o.order._id, duration: o.duration })));
  
      // 6. Trouver la durée de la commande d'entrée et calculer le cumul
      let resultDuration = 0;
      let inputOrderDuration = 0;
      let cumulativeDurations = [];
  
      for (let { order: currentOrder, duration } of ordersWithDurations) {
        if (currentOrder._id.toString() === orderId.toString()) {
          inputOrderDuration = duration;
          resultDuration += inputOrderDuration; // Ajouter la durée de la commande en entrée
          console.log(`Input order found. ID: ${currentOrder._id}, Duration: ${duration}`);
        } else if (duration < inputOrderDuration ) {
          resultDuration += duration; // Ajouter seulement les commandes ayant une durée inférieure
          console.log(`Adding duration for order ${currentOrder._id}. Duration: ${duration}`);
        }
        cumulativeDurations.push({ orderId: currentOrder._id, duration });
      }
  
      console.log(`Cumulative duration for the input order ${orderId}: ${Math.floor(resultDuration)} minutes`);
      return {
        orderId,
        inputOrderDuration,
        resultDuration, // La durée totale incluant la commande en entrée et les autres
        cumulativeDurations // Détail des durées cumulées pour chaque commande
      };
    } catch (error) {
      console.error('Error calculating order duration:', error);
      throw error;
    }
  }
  
module.exports = {
    getRouteDetails,
    calculateRoute,
    calculateCumulativeOrderDuration
};