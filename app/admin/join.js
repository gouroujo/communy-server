const cloudinary = require('cloudinaryClient');
// const pubsub = require('utils/pubsub');
const config = require('config');
const models = require('db').models;
const createOrganisation = require('resolvers/Organisation').Mutation.createOrganisation;

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
      createOrganisation(null, { input: {
        title: organisation.title,
        description: organisation.description,
        type: organisation.type,
        categories: organisation.categories
      } }, { currentUser: u })
    ])
  })
  .then(([u , o]) => {
    return Promise.all([
      Promise.resolve({
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
          prefix: organisation.prefix,
        },
        subject: 'join'
      }),

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
  // .then(([ data ]) => {
  //   if (!config.get('PUBSUB_TOPIC_EMAIL')) {
  //     console.log(data);
  //     throw new Error('No pubsub topic defined to send reset email. message not send')
  //   }
  //   return pubsub.publishMessage(config.get('PUBSUB_TOPIC_EMAIL'), data);
  // })
  .then(() => {
    return res.sendStatus(200);
  })
  .catch(e => {
    console.log(e);
    res.status(500).send(e.message);
  })

}
