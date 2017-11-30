const sanitizeHtml = require('sanitize-html');

module.exports = async function (parent, { id, input }, { auth, loaders, logger, models }) {
  if (!auth) return new Error('Unauthorized');
  if (!auth.check(`organisation:${id}:edit`)) return new Error('Forbidden');

  try {
    const organisation = await models.Organisation.findByIdAndUpdate(id, Object.assign(input, {
      description: sanitizeHtml(input.description),
    }), { new: true, upsert: false })

    if (!organisation) return null;

    await Promise.all([
      models.Registration.updateMany({
        "organisation._id": id
      }, {
        $set: {
          "organisation": organisation.toObject(),
        }
      }),
      models.Partnership.updateMany({
        "organisation._id": id
      }, {
        $set: {
          "organisation": organisation.toObject(),
        }
      }),
      models.User.updateMany({
        "registrations": {
          $elemMatch: { "organisation._id": id }
        }
      }, {
        $set: {
          "registrations.$.organisation": organisation.toObject(),
        }
      }),
      models.Event.updateMany({
        "organisation._id": id
      }, {
        $set: {
          "organisation": organisation.toObject(),
        }
      }),
    ]);

    loaders.Organisation.prime(id, organisation);
    return organisation;

  } catch(e) {
    logger.error(e);
    return null;
  }
}
