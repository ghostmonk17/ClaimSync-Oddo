const WorkflowConfig = require('./workflowConfig.model');

class WorkflowConfigController {
  async getConfig(req, res, next) {
    try {
      const { company_id } = req.user;
      let config = await WorkflowConfig.findOne({ company_id, is_active: true }).lean();
      
      // Return default outline if none exists
      if (!config) {
         config = {
           company_id,
           name: 'Default Sequential Workflow',
           steps: [
             { step: 1, type: 'SEQUENTIAL', roles: ['MANAGER'] },
             { step: 2, type: 'SEQUENTIAL', roles: ['FINANCE'] },
             { step: 3, type: 'SEQUENTIAL', roles: ['SENIOR'] }
           ],
           override_rules: { cfo_override: true },
           is_active: true
         };
      }
      
      return res.status(200).json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  }

  async saveConfig(req, res, next) {
    try {
      const { company_id } = req.user;
      const { name, steps, override_rules } = req.body;

      // Invalidate old config safely
      await WorkflowConfig.updateMany({ company_id }, { is_active: false });

      // Create new active version logically mapping the engine
      const newConfig = new WorkflowConfig({
          company_id,
          name: name || 'Custom Enterprise Workflow',
          steps,
          override_rules: override_rules || { cfo_override: true },
          is_active: true
      });

      await newConfig.save();

      return res.status(200).json({
         success: true,
         message: 'Workflow configuration updated successfully',
         data: newConfig
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WorkflowConfigController();
