const { verify } = require('jsonwebtoken');
const shiroTrie = require('shiro-trie');

const verifyAsync = require('util').promisify(verify);
const logger = require('logger');
const config = require('config');
const { models } = require('db');
const { orgPermissions } = require('dict');

module.exports = () => async (req, res, next) => {
  const token = req.headers.authorization || req.body.variables && req.body.variables.token;
  if (!token || token === 'null') return next()
  try {
    const payload = await verifyAsync(token, config.get('SECRET'))
    if (!payload) return null;
    const user = await models.User.findById(payload.id, 'id registrations memberships').lean().exec()

    if (!user) throw new Error(`User ${payload.id} not found`);

    const permissions = shiroTrie.new();
    if (user.registrations) {
      permissions.add(user.registrations.reduce((p, r) => {
        if (!r.role || !r.organisation._id) return p;
        return p.concat(orgPermissions[r.role].map(a => `organisation:${r.organisation._id}:${a}`));
      }, []));

      // permissions.add(user.memberships.reduce((p, m) => {
      //   if (!m.role || !m.network._id) return p;
      //   return p.concat(networkPermissions[m.role].map(a => `network:${m.network._id}:${a}`));
      // }, []));

    }
    res.locals.auth = permissions;
    res.locals.userId = String(user._id);

    next();
  } catch (e) {
    logger.error(e);
    res.sendStatus(401);
  }
}
