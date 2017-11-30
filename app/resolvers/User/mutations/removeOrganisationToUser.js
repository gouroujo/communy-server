module.exports = async (parent, { organisationId }, { currentUserId, logger, models }) => {
  if (!currentUserId) return null;

  try {
    const registration = await models.Registration.findOne({
      "user._id": currentUserId,
      "organisation._id": organisationId,
    }).lean().exec();
    if (!registration) return null;

    const [ user ] = await Promise.all([
      models.User.findByIdAndUpdate(currentUserId, {
        $pull: {
          registrations: { "organisation._id": organisationId },
        },
        $inc: {
          norganisations: (registration.ack && registration.confirm) ? -1 : 0
        }
      }, { new: true }),
      models.Organisation.updateOne({ "_id": organisationId}, {
        $inc: {
          nwt_confirm: (registration.ack && !registration.confirm) ? -1 : 0,
          nwt_ack: (!registration.ack && registration.confirm) ? -1 : 0,
          nusers: (registration.ack && registration.confirm) ? -1 : 0,
        }
      }),
      models.Registration.updateOne({ "_id": registration._id}, {
        confirm: false,
        ack: false,
        role: null,
      })
    ])

    return user
  } catch(e) {
    logger.error(e);
    return null;
  }

}
