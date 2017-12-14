const { models } = require('db');
const logger = require('logger');
const { roles } = require('dict');
const config = require('config');

// const pubsub = require('utils/pubsub');

module.exports = async function (parent, { id, input }, { currentUserId, auth, loaders }) {
  if (!auth) return null;
  if (!auth.check(`organisation:${id}:add_user`)) return null;
  const date = new Date();

  try {
    // 1 - Get the current user for authoring
    const currentUser = await loaders.User.load(currentUserId);
    const organisation = await models.Organisation.findById(id);
    if (!organisation) return null;

    // 3 - Create all the users
    await models.User.bulkWrite(input.users.map(user => ({
      updateOne: {
        filter: {
          email: user.email
        },
        update: {
          $setOnInsert: {
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            userCreated: false,
            norganisations: 0,
            nnetworks: 0,
          },
        },
        upsert: true,
      }
    })), { ordered: false });

    // 4 - Find the newly created users
    const users = await models.User.find({ email: { $in: input.users.map(u => u.email) } });

    // 5 - Write the Registration
    await models.Registration.bulkWrite(users.map(user => ({
      updateOne: {
        filter: {
          "user._id": user._id,
          "organisation._id": organisation._id
        },
        update: {
          $set : {
            confirm: true,
            role: roles.MEMBER,
            updatedAt: date,
          },
          $setOnInsert: {
            ack: false,
            "user._id": user._id,
            "user.fullname": (user.firstname || user.lastname) ? `${user.firstname + ' ' || ''}${user.lastname || ''}` : user.email,
            "organisation._id": organisation._id,
            "organisation.title": organisation.title,
            createdAt: date,
          }
        },
        upsert: true,
      }
    })), { ordered: false })

    // 4 - Find the newly created registrations and update users
    const [
      registrations,
      updatedUsers
    ] = await Promise.all([
      models.Registration.find({
        "organisation._id": organisation._id,
        "user._id": { $in: users.map(u => u._id) }
      }).lean().exec(),
      models.User.updateMany({
        _id: { $in: users.map(u => u._id) },
        registrations: {
          $elemMatch: { "organisation._id": organisation._id }
        }
      }, {
        $set: {
          "registrations.$.confirm": true,
          "registrations.$.role": roles.MEMBER
        },
        $inc: { norganisations: 1 },
      }).lean().exec()
    ]);

    // Update the UserSchema
    await models.User.bulkWrite(registrations.map(registration => {
      return ({
        updateOne: {
          filter: {
            registrations: {
              $not: {
                $elemMatch: { "organisation._id": organisation._id }
              }
            },
            _id: registration.user._id
          },
          update: {
            $push: {
              registrations: {
                _id: registration._id,
                organisation: {
                  _id: organisation._id,
                  title: organisation.title,
                },
                confirm: true,
                ack: false,
                role: roles.MEMBER,
              }
            }
          }
        }
      })
    }))

    // if (!config.get('PUBSUB_TOPIC_EMAIL')) {
    //   logger.info('No pubsub topic defined to send invitation emails. messages not send');
    // } else {
    //   await Promise.all([
    //     users.map(user => pubsub.publishMessage(config.get('PUBSUB_TOPIC_EMAIL'), {
    //       token: {
    //         id: user.id,
    //         organisationId: organisation._id,
    //       },
    //       author: (currentUser.firstname || currentUser.lastname) ? `${currentUser.firstname + ' ' || ''}${currentUser.lastname || ''}` : currentUser.email,
    //       organisation: {
    //         id: organisation.id,
    //         title: organisation.title,
    //       },
    //       user: {
    //         fullname: user.fullname,
    //         email: user.email,
    //       },
    //       message: input.message,
    //       subject: 'invite-organisation',
    //     }))
    //   ])
    // }

    const updatedOrganisation = await models.Organisation.findByIdAndUpdate(organisation._id, {
      $inc: {
        nusers: updatedUsers.nModified,
        nwt_ack: users.length - updatedUsers.nModified,
        nwt_confirm: -updatedUsers.nModified,
      }
    }, { new: true });

    loaders.Organisation.prime(organisation._id, updatedOrganisation);
    return updatedOrganisation;

  } catch (e) {
    logger.error(e);
    return null;
  }
}
