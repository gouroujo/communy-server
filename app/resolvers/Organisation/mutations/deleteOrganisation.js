
module.exports = async function (parent, { id }, { auth, models }) {
  if (!auth) return null;
  if (!auth.check(`organisation:${id}:delete`)) return null;

  try {
    await models.Organisation.deleteOne({ _id: id });
    const events = await models.Event.deleteMany({ "organisation._id": id });
    await models.Registration.deleteMany({ "organisation._id": id });
    await models.User.bulkWrite([
      {
        deleteMany: {
          filter: {
            userCreated: { $ne: true },
            registrations: {
              $elemMatch: { "organisation._id": id },
              $size: 1,
            }
          }
        }
      },
      {
        updateMany: {
          filter: {
            registrations: {
              $elemMatch: {
                $or: [
                  { _id: id, ack: false },
                  { _id: id, role: null },
                ]
              },
            },
            $or: [{ "registrations.1": { $exists: true } }, { userCreated: true }],
          },
          update: {
            $pull: { registrations: { "organisation._id": id } },
          }
        },
      },
      {
        updateMany: {
          filter: {
            registrations: {
              $elemMatch: { "organisation._id": id, ack: true, role: { $exists: true, $ne: null } },
            },
            $or: [{ "registrations.1": { $exists: true } }, { userCreated: true }],
          },
          update: {
            $pull: { registrations: { "organisation._id": id } },
            $inc: { norganisations: -1 }
          }
        },
      },
    ]);
    console.log(events);

    return null;

  } catch (e) {
    console.log(e);
    return null;
  }

}
