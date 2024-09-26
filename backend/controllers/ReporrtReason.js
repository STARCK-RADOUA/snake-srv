const ReportReason = require('../models/ReportReason');

// Ajouter un nouveau motif
exports.addReportReason = async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Le motif est requis.' });
  }

  try {
    const newReason = new ReportReason({ reason });
    await newReason.save();
    return res.status(201).json({ message: 'Motif ajouté avec succès.', newReason });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du motif:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};
exports.reportOrder = async (req, res) => {
    const { orderId, driverId, report_reason, report_comment } = req.body;
  
    if (!report_reason || !report_comment) {
      return res.status(400).json({ error: 'Le motif et le commentaire sont obligatoires.' });
    }
  
    try {
      // Vérifier si le motif est valide
      const validReason = await ReportReason.findOne({ reason: report_reason, active: true });
      if (!validReason) {
        return res.status(400).json({ error: 'Le motif sélectionné n\'est pas valide.' });
      }
  
      // Rechercher la commande à signaler
      const order = await Order.findById(orderId);
  
      if (!order) {
        return res.status(404).json({ error: 'Commande non trouvée.' });
      }
  
      // Vérifiez si c'est bien le livreur de cette commande
      if (order.driver_id.toString() !== driverId) {
        return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à signaler cette commande.' });
      }
  
      // Mettre à jour la commande avec le motif et le commentaire
      order.status = 'cancelled';
      order.report_reason = report_reason;
      order.report_comment = report_comment;
  
      await order.save();
  
      // Notifier l'administrateur
      await notifyAdmin(order, report_reason, report_comment);
  
      return res.status(200).json({ message: 'Commande signalée et annulée avec succès.' });
    } catch (error) {
      console.error('Erreur lors du signalement de la commande:', error.message);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  };
  
// Modifier un motif existant
exports.updateReportReason = async (req, res) => {
  const { reasonId, reason } = req.body;

  if (!reasonId || !reason) {
    return res.status(400).json({ error: 'Le motif et l\'ID du motif sont requis.' });
  }

  try {
    const updatedReason = await ReportReason.findByIdAndUpdate(reasonId, { reason }, { new: true });
    if (!updatedReason) {
      return res.status(404).json({ error: 'Motif non trouvé.' });
    }

    return res.status(200).json({ message: 'Motif mis à jour avec succès.', updatedReason });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du motif:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};

// Supprimer un motif
exports.deleteReportReason = async (req, res) => {
  const { reasonId } = req.body;

  if (!reasonId) {
    return res.status(400).json({ error: 'L\'ID du motif est requis.' });
  }

  try {
    await ReportReason.findByIdAndDelete(reasonId);
    return res.status(200).json({ message: 'Motif supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression du motif:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};

// Récupérer tous les motifs actifs
exports.getReportReasons = async (req, res) => {
  try {
    const reasons = await ReportReason.find({ active: true });
    return res.status(200).json(reasons);
  } catch (error) {
    console.error('Erreur lors de la récupération des motifs:', error.message);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
};
