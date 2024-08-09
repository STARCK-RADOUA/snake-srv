const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// Get all sessions
router.get('/', sessionController.getAllSessions);

// Get a session by ID
router.get('/:id', sessionController.getSessionById);

// Create a new session
router.post('/', sessionController.createSession);

// Update a session
router.put('/:id', sessionController.updateSession);

// Delete a session
router.delete('/:id', sessionController.deleteSession);

module.exports = router;
