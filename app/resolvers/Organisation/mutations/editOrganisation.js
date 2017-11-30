const sanitizeHtml = require('sanitize-html');

module.exports = async function (parent, { id, input }, { auth, loaders, logger, models }) {
  if (!auth) return new Error('Unauthorized');
  if (!auth.check(`organisation:${id}:edit`)) return new Error('Forbidden');

  try {
    const organisation = await models.Organisation.findById(id);
    if (!organisation) return null;

    if (input.title && organisation.title !== input.title.trim() ) {
      const results = await Promise.all([
        models.Organisation.findByIdAndUpdate(id, Object.assign(input, {
          description: sanitizeHtml(input.description),
        }), { new: true }),
        models.Registration.updateMany({
          "organisation._id": id
        }, {
          $set: {
            "organisation.title": input.title,
          }
        }),
        models.Partnership.updateMany({
          "organisation._id": id
        }, {
          $set: {
            "organisation.title": input.title,
          }
        }),
        models.User.updateMany({
          "registrations": {
            $elemMatch: { "organisation._id": id }
          }
        }, {
          $set: {
            "registrations.$.organisation.title": input.title,
          }
        }),
        models.Event.updateMany({
          "organisation._id": id
        }, {
          $set: {
            "organisation.title": input.title,
          }
        }),
      ]);
      loaders.Organisation.prime(id, results[0]);
      return results[0];
    }

    const result = await models.Organisation.findByIdAndUpdate(id, Object.assign(input, {
      description: sanitizeHtml(input.description),
    }), { new: true });
    loaders.Organisation.prime(id, result);
    return result;

  } catch(e) {
    logger.error(e);
    return null;
  }
}
