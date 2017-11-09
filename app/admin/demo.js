const config = require('../config');
const demoMode = require('../utils/demoMode');

module.exports = async function(req, res) {
  if (!config.get('ADMIN_PASSWORD')) return res.sendStatus(401);
  if (req.body.adminPassword != config.get('ADMIN_PASSWORD')) return res.sendStatus(401);

  const {
    organisationId,
    demo,
    options
  } = req.body;

  try {
    if (demo) {
      const result = await demoMode(organisationId, options);
      return res.status(201).json(result);
    }

    return res.sendStatus(200);
  } catch (e) {
    console.log(e);
    return res.sendStatus(500);
  }
}
