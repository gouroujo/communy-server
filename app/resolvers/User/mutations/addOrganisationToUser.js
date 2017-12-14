
module.exports = async function(parent, { organisationId }, { currentUserId, loaders, models, logger }) {
  if (!currentUserId) return null;

  try {
    const [
      user,
      organisation
    ] = await Promise.all([
      models.User.findById(currentUserId, 'email firstname lastname'),
      models.Organisation.findById(organisationId, 'title type')
    ]);
    if (!user || !organisation) return null;

    user.registration = {
      id: 1,
      ack: true,
      confirm: false,
      permissions: [],
      role: null
    }
    // return user
    let registration = await models.Registration.findOne({
      "organisation._id": organisationId,
      "user._id": currentUserId,
      "ack": false,
      "confirm": false,
    });

    if (!registration) registration = new models.Registration();
    registration.set({
      user: {
        _id: user._id,
        fullname: (user.firstname || user.lastname) ? `${user.firstname || ''} ${user.lastname || ''}` : user.email,
      },
      organisation: {
        _id: organisation._id,
        title: organisation.title
      },
      ack: true,
      confirm: organisation.type === "public" ? true : false
    })

    const [ updatedUser ] = await Promise.all([
      models.User.findByIdAndUpdate(currentUserId, {
        $push: {
          registrations: registration.toObject(),
        },
        $inc: {
          norganisations: (registration.ack && registration.confirm) ? 1 : 0
        }
      }, { new: true }).lean().exec(),
      models.Organisation.updateOne({ "_id": organisationId }, {
        $inc: {
          nwt_confirm: (registration.ack && !registration.confirm) ? 1 : 0,
          nwt_ack: (!registration.ack && registration.confirm) ? 1 : 0,
          nusers: (registration.ack && registration.confirm) ? 1 : 0,
        }
      }),
      registration.save()
    ])

    loaders.User.clear(updatedUser._id).prime(updatedUser._id, updatedUser)
    return updatedUser;

  } catch(e) {
    logger.error(e);
    return null;
  }
}
