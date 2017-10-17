const cloudinary = require('../cloudinary');
const config = require('../config');
const models = require('../db').models;
const createOrganisation = require('../resolvers/organisation').Mutation.createOrganisation;

module.exports = function(req, res) {
  if (!config.get('ADMIN_PASSWORD')) return res.sendStatus(401);
  if (req.body.adminPassword != config.get('ADMIN_PASSWORD')) return res.sendStatus(401);

  const {
    organisation,
    user,
  } = req.body;

  let u = null;
  let o = null;
  return models.User.create(user)
  .then(u => {
    return Promise.all([
      u.getToken(),
      createOrganisation(null, { input: {
        title: organisation.title,
        description: organisation.description,
        type: organisation.type,
        categories: organisation.categories
      } }, { currentUser: u })
    ])
  })
  .then(([token , o]) => {
    return Promise.all([
      Promise.resolve(token),
      ((organisation.logo) ? cloudinary.upload(organisation.logo, {
        timestamp: Date.now(),
        public_id: `organisations/${o._id}/logo`,
        tags: `logo,${o._id},organisation`,
        resource_type: 'image',
        upload_preset: 'logo'
      }) : Promise.resolve()),

      ((organisation.cover) ? cloudinary.upload(organisation.cover, {
        timestamp: Date.now(),
        public_id: `organisations/${o._id}/cover`,
        tags: `cover,${o._id},organisation`,
        resource_type: 'image',
        upload_preset: 'cover'
      }) : Promise.resolve())
    ])
  })
  .then(([ token ]) => {
    return res.status(201).json({ token });
  })
  .catch(e => {
    console.log(e);
    res.status(500).send(e.message);
  })

}
