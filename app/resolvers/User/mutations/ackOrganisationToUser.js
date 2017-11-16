
module.exports = async function(parent, { organisationId }, { currentUserId, loaders, models, logger }) {
  if (!currentUserId) return null;

  try {
    const registration = await models.Registration.findOne({
      "organisation._id": organisationId,
      "user._id": currentUserId,
      "confirm": true,
    });

    if (!registration) return null;
    if (registration.ack) return loaders.User.load(currentUserId);

    const [ user ] = await Promise.all([
      models.User.findOneAndUpdate({
        "_id": currentUserId,
        registrations: {
          $elemMatch: { "organisation._id": organisationId }
      }
      },{
        "$set": {
          "registrations.$.ack": true,
        },
        $inc: { norganisations: 1 },
      }, { new: true }).lean().exec(),
      models.Organisation.updateOne({ "_id": organisationId}, {
        "$inc": {
          nusers: 1,
          nwt_ack: -1,
        }
      }),
      models.Registration.updateOne({
        "user._id": currentUserId,
        "organisation._id": organisationId,
      },{
        ack: true
      })
    ]);

    loaders.User.clear(user._id).prime(user._id, user)
    return user

  } catch(e) {
    logger.error(e);
    return null;
  }
}
