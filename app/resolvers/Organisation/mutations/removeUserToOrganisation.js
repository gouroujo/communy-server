
module.exports = async (parent, { id, userId }, { auth, logger, models }) => {
  if (!auth) return null;
  if (!auth.check(`organisation:${id}:remove_user`)) return null;

  try {
    const registration = await models.Registration.findOne({
      "user._id": userId,
      "organisation._id": id,
    }).lean().exec();
    if (!registration) return null;

    const [ organisation ] = await Promise.all([
      models.Organisation.findByIdAndUpdate(id, {
        $inc: {
          nwt_confirm: (registration.ack && !registration.confirm) ? -1 : 0,
          nwt_ack: (!registration.ack && registration.confirm) ? -1 : 0,
          nusers: (registration.ack && registration.confirm) ? -1 : 0,
        }
      }, { new: true }),
      models.User.updateOne({ "_id": userId}, {
        $pull: {
          registrations: { "organisation._id": id },
        },
        $inc: {
          norganisations: (registration.ack && registration.confirm) ? -1 : 0
        }
      }),
      models.Registration.updateOne({ "_id": registration._id}, {
        confirm: false,
        ack: false,
        role: null,
      })
    ])

    return organisation
  } catch(e) {
    logger.error(e);
    return null;
  }

}
