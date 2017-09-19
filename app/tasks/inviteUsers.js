const { models } = require('../db');
const { orgStatus } = require('../dict');

module.exports = function (users, organisation) {
  const date = new Date();
  return Promise.all([
    models.User.updateMany({
      _id: { $in: users.map(u => u._id) },
      organisations: {
        $not: {
          $elemMatch: { _id: organisation._id }
        }
      }
    }, {
      $push: {
        organisations: {
          _id: organisation._id,
          title: organisation.title,
          logo: organisation.logo,
          confirm: true,
          role: orgStatus.MEMBER,
        }
      }
    }),
    models.User.updateMany({
      _id: { $in: users.map(u => u._id) },
      organisations: {
        $elemMatch: { _id: organisation._id, ack: true, role: null }
      }
    }, {
      $set: {
        "organisations.$.confirm": true,
        "organisations.$.role": orgStatus.MEMBER
      },
      $inc: { norganisations: 1 },
    }),
    models.Registration.bulkWrite(users.map(user => ({
      updateOne: {
        filter: {
          "user._id": user._id,
          "organisation._id": organisation._id
        },
        update: {
          $set : {
            confirm: true,
            role: orgStatus.MEMBER,
            updatedAt: date,
          },
          $setOnInsert: {
            ack: false,
            "user._id": user._id,
            "user.email": user.email,
            "user.firstname": user.firstname,
            "user.lastname": user.lastname,
            "user.avatar": user.avatar,
            "organisation._id": organisation._id,
            "organisation.title": organisation.title,
            "organisation.logo": organisation.logo,
            createdAt: date,
          }
        },
        upsert: true,
      }
    })), { ordered: false })
  ]).then(([ resInvited, resConfirmed ]) => {
    return Promise.all([
      models.Organisation.findByIdAndUpdate(organisation._id, {
        $inc: {
          nusers: resConfirmed.n,
          nwt_ack: resInvited.n,
          nwt_confirm: -resConfirmed.n,
        }
      }, { new: true }),
      Promise.resolve(users)
    ])
  })
}
