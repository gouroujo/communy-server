const cloudinary = require('cloudinaryClient');
const config = require('config');
const models = require('db').models;
const createOrganisation = require('resolvers/organisation').Mutation.createOrganisation;
const { sign } = require('jsonwebtoken');
const logger = require('logger');

module.exports = async function(req, res) {
  if (!config.get('ADMIN_PASSWORD')) return res.sendStatus(401);
  if (req.body.adminPassword != config.get('ADMIN_PASSWORD')) return res.sendStatus(401);

  const {
    organisation,
    user,
  } = req.body;

  try {
    const u = await models.User.create(user);
    const o = await createOrganisation(null, { input: {
        title: organisation.title,
        description: organisation.description,
        type: organisation.type,
        categories: organisation.categories
      } }, { currentUser: u })

    const token = await sign({ id: u._id, organisationId: o._id },
      config.get('SECRET'),
      { subject: 'join' }
    )

    if (organisation.logo) {
      await cloudinary.upload(organisation.logo, {
        timestamp: Date.now(),
        public_id: `organisations/${o._id}/logo`,
        tags: `logo,${o._id},organisation`,
        resource_type: 'image',
        upload_preset: 'logo'
      });
    }

    if (organisation.cover) {
      await cloudinary.upload(organisation.cover, {
        timestamp: Date.now(),
        public_id: `organisations/${o._id}/cover`,
        tags: `cover,${o._id},organisation`,
        resource_type: 'image',
        upload_preset: 'cover'
      })
    }

    res.status(201).json({ token })

  } catch (e) {
    logger.errror(e)
    res.status(500).send(e.message);
  }
}
