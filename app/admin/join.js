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
    message,
  } = req.body;

  let u = null;
  let o = null;
  return models.User.create(user)
  .then(u => {
    return Promise.all([
      Promise.resolve(u),
      createOrganisation(null, { input: organisation }, { currentUser: u })
    ])
  })
  .then(([u , o]) => {
    return Promise.all([
      Promise.resolve(JSON.stringify({
        token: {
          id: u._id,
          organisationId: o._id
        },
        message: message,
        user: {
          fullname: u.fullname,
          email: u.email,
        },
        organisation: {
          title: o.title,
        },
        subject: 'join'
      })),

      ((organisation.logo) ? cloudinary.upload(organisation.logo, {
        timestamp: Date.now(),
        public_id: `organisations/${o._id}/logo`,
        unique_filename: false,
        discard_original_filename: true,
        tags: `logo,${o._id},organisation`,
        format: 'jpg',
        resource_type: 'image',
        eager: ['logoT'],
        eager_async: true,
      }) : Promise.resolve()),

      ((organisation.cover) ? cloudinary.upload(organisation.cover, {
        timestamp: Date.now(),
        public_id: `organisations/${o._id}/cover`,
        unique_filename: false,
        discard_original_filename: true,
        tags: `cover,${o._id},organisation`,
        format: 'jpg',
        resource_type: 'image',
        eager: ['coverT'],
        eager_async: true,
      }) : Promise.resolve())
    ])
  })
  .then(([ data ]) => {
    if (!config.get('PUBSUB_TOPIC_EMAIL')) {
      console.log(data);
      throw new Error('No pubsub topic defined to send reset email. message not send')
    }
    return pubsub.publishMessage(config.get('PUBSUB_TOPIC_EMAIL'), Buffer.from(data));
  })
  .then(() => {
    return res.sendStatus(200);
  })
  .catch(e => {
    console.log(e);
    res.status(500).send(e.message);
  })

}
