const config = require('../config');
const db = require('../db');

module.exports = async function(req, res) {
  if (!config.get('ADMIN_PASSWORD')) return res.sendStatus(401);
  if (req.body.adminPassword != config.get('ADMIN_PASSWORD')) return res.sendStatus(401);

  const {
    file,
    demo
  } = req.body;

  try {
    const migration = require("../migrations/" + file)
    const result = await migration();
    return res.json(result);
  } catch (e) {
    console.log(e);
    return res.status(500).json(e);
  }
}
