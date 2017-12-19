const { models } = require('db');
const { roles } = require('dict')
const sanitizeHtml = require('sanitize-html');

module.exports = async function (parent, { input }, { logger, currentUserId, loaders }) {
  logger.debug(`mutation CreateOrganisation (userId: ${currentUserId})`, input)
  if (!currentUserId) return null;

  try {
    const currentUser = await loaders.User.load(currentUserId);
    const organisation = await models.Organisation.create(Object.assign({}, input, {
      nusers: 1,
      description: input.description ? sanitizeHtml(input.description) : null
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

    await models.User.update({ _id: currentUser._id }, {
      $push: {
        registrations: registration.toObject(),
      },
      $inc: { norganisations: 1 }
    }),

    loaders.Organisation.prime(organisation._id, organisation)
    return organisation;

  } catch(e) {
    logger.error(`mutation createOrganisation (userId: ${currentUserId}): ${e.message}`, e)
    return null;
  }
}
