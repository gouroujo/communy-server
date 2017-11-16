const { models } = require('db');
const logger = require('logger')
const { roles } = require('dict');

module.exports = async function (parent, { input }, { currentUserId, loaders }) {
  if (!currentUserId) return null;

  try {
    const currentUser = await loaders.User.load(currentUserId);
    const organisation = await models.Organisation.create(Object.assign({}, input, {
      nusers: 1,
    }));

    const registration = await models.Registration.create({
      user: {
        _id: currentUser._id,
        fullname: (currentUser.firstname || currentUser.lastname) ? `${currentUser.firstname + ' ' || ''}${currentUser.lastname || ''}` : currentUser.email
      },
      organisation: organisation.toObject(),
      ack: true,
      confirm: true,
      role: roles.ADMIN,
    });

    await Promise.all([
      models.User.update({ _id: currentUser._id }, {
        $push: {
          registrations: registration.toObject(),
        },
        $inc: { norganisations: 1 }
      }),

    ]);

    loaders.Organisation.prime(organisation._id, organisation)
    return organisation;

  } catch(e) {
    logger.warn(e);
    return null;
  }
}
