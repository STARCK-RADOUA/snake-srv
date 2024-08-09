const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');

// Get all referrals
router.get('/', referralController.getAllReferrals);

// Get a referral by ID
router.get('/:id', referralController.getReferralById);

// Create a new referral
router.post('/', referralController.createReferral);

// Update a referral
router.put('/:id', referralController.updateReferral);

// Delete a referral
router.delete('/:id', referralController.deleteReferral);

module.exports = router;
