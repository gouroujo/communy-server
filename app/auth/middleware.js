const { verify } = require('jsonwebtoken');
const shiroTrie = require('shiro-trie');

const verifyAsync = require('util').promisify(verify);

const config = require('../config');
const { models } = require('../db');
const { orgPermissions } = require('../dict');

module.exports = () => async (req, res, next) => {
  const token = req.headers.authorization || req.body.variables && req.body.variables.token;
  if (!token) return next();
  try {
    const payload = await verifyAsync(token, config.get('SECRET'))
    if (!payload) return null;
    const user = await models.User.findById(payload.id, 'id registrations').lean().exec()

    if (!user) throw new Error(`User ${payload.id} not found`);

    const permissions = shiroTrie.new();
    if (user.registrations) {
      permissions.add(user.registrations.reduce((p, r) => {
        if (!r.role || !r.organisation._id) return p;
        return p.concat(orgPermissions[r.role].map(a => `organisation:${r.organisation._id}:${a}`));
      }, []));
    }
    res.locals.auth = permissions;
    res.locals.userId = String(user._id);

    next();
  } catch (e) {
    console.log(e);
    res.sendStatus(401);
  }
}