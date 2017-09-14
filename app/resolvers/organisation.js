const { models } = require('../db');

// const getFieldNames = require('../utils/getFields');
const signCloudinary = require('../utils/signCloudinary');

const inviteUsers = require('../tasks/inviteUsers');
const removeUsers = require('../tasks/removeUsers');

const config = require('../config');
const { orgMemberStatus, orgStatus } = require('../dict');

module.exports = {
  Organisation: {
    id(organisation) {
      return organisation.ref || organisation._id || organisation.id;
    },

    logo(organisation) {
      return organisation.logo || organisation.logoUrl;
    },

    cover(organisation) {
      return organisation.cover || organisation.coverUrl;
    },

    role(organisation, args, { currentUser }) {
      if (typeof organisation.role !== 'undefined') return organisation.role
      return models.Registration.findOne({
        "user._id": currentUser._id,
        "organisation._id": organisation._id
      })
      .then(r => r ? r.role : null)
      .catch(e => console.log(e));
    },

    ack(organisation, args, { currentUser }) {
      if (typeof organisation.ack !== 'undefined') return organisation.ack
      return models.Registration.findOne({
        "user._id": currentUser._id,
        "organisation._id": organisation._id
      })
      .then(r => r ? r.ack : false)
      .catch(e => console.log(e));
    },

    confirm(organisation, args, { currentUser }) {
      if (typeof organisation.confirm !== 'undefined') return organisation.confirm
      return models.Registration.findOne({
        "user._id": currentUser._id,
        "organisation._id": organisation._id
      })
      .then(r => r ? r.confirm : false)
      .catch(e => console.log(e));
    },

    nusers(organisation) {
      return organisation.nusers;
    },

    nack(organisation) {
      return organisation.nwt_ack;
    },

    nconfirm(organisation) {
      return organisation.nwt_confirm;
    },

    registration(organisation, { userId }, { currentUser }) {
      return models.Registration.findOne({
        "organisation._id": organisation._id,
        "user._id": userId || currentUser._id,
      })
    },

    registrations(organisation, { role, limit, offset, ack = true, confirm = true }, { currentUser }, info) {
      if (!currentUser) return new Error('Unauthorized');

      const query = models.Registration.find({
        "organisation._id": organisation._id,
        "ack": ack,
        "confirm": confirm
      });
      if (typeof role !== 'undefined') query.where('role').equals(role)
      return query.limit(limit).skip(offset).lean().exec();
    },

    nevents(organisation) {
      return organisation.nevents || 0
    },

    events(organisation, { after, before, limit, offset }, { currentUser }, info) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${organisation._id}:event_list`)) return new Error('Forbidden');

      const query = models.Event.find({
        "organisation._id": organisation._id
      })

      if (after) query.gte('endTime', after)
      if (before) query.lte('startTime', before)
      return query.limit(limit).skip(offset).lean().exec()
    },

    coverUploadOpts(organisation) {
      if(!organisation || !organisation._id) return null;

      const options = {
        api_key: config.get('CLOUDINARY_KEY'),
        timestamp: Date.now(),
        public_id: `organisations/${organisation._id}/cover`,
        overwrite: true,
        invalidate: true,
        return_delete_token: true,
        discard_original_filename: true,
        tags: `cover,${organisation._id},organisation`,
        format: 'jpg',
        resource_type: 'image',
      };

      return JSON.stringify(Object.assign({}, options, {
        signature : signCloudinary(options)
      }));
    }
  },

  Query: {
    organisations(_, { limit, offset }) {
      return models.Organisation.find({
        secret: false
      })
      .skip(offset)
      .limit(limit)
      .lean();
    },

    organisation(_, { id }) {
      return models.Organisation.findById(id).lean()
    },
  },

  Mutation: {

    createOrganisation(parent, { input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');

      return models.Organisation.create(Object.assign({}, input, {
        nusers: 1,
      }))
      .then(organisation => {
        currentUser.organisations.push(Object.assign({}, organisation.toObject(), { ack: true, role: orgStatus.ADMIN }))
        currentUser.norganisations++;
        return Promise.all([
          Promise.resolve(organisation),
          currentUser.save(),
          models.Registration.create({
            user: currentUser.toObject(),
            organisation: organisation.toObject(),
            ack: true,
            confirm: true,
            role: orgStatus.ADMIN,
          })
        ]).then(([ organisation ]) => organisation);
      });
    },

    editOrganisation(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${id}:edit`)) return new Error('Forbidden');

      return Promise.all([
        models.Organisation.findByIdAndUpdate(id, input, { new: true }),
        models.Registration.updateMany({
          "organisation._id": id
        }, {
          $set: {
            "organisation.logo": input.logo,
            "organisation.title": input.title,
          }
        }),
        models.User.updateMany({
          "organisations": {
            $elemMatch: { _id: id }
          }
        }, {
          $set: {
            "organisations.$.logo": input.logo,
            "organisations.$.title": input.title,
          }
        }),
      ])
      .then(([ organisation ]) => organisation)
      .catch(e => console.log(e))
    },

    deleteOrganisation(parent, { id }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${id}:delete`)) return new Error('Forbidden');

      return Promise.all([
        models.Organisation.deleteOne({ _id: id }),
        models.Event.deleteMany({ "organisation._id": id }),
        models.Registration.deleteMany({ "organisation._id": id }),
        models.User.bulkWrite([
          {
            deleteMany: {
              filter: {
                userCreated: { $ne: true },
                organisations: {
                  $elemMatch: { _id: id },
                  $size: 1,
                }
              }
            }
          },
          {
            updateMany: {
              filter: {
                organisations: {
                  $elemMatch: {
                    $or: [
                      { _id: id, ack: false },
                      { _id: id, role: null },
                    ]
                  },
                },
                $or: [{ "organisations.1": { $exists: true } }, { userCreated: true }],
              },
              update: {
                $pull: { organisations: { _id: id } },
              }
            },
          },
          {
            updateMany: {
              filter: {
                organisations: {
                  $elemMatch: { _id: id, ack: true, role: { $exists: true, $ne: null } },
                },
                $or: [{ "organisations.1": { $exists: true } }, { userCreated: true }],
              },
              update: {
                $pull: { organisations: { _id: id } },
                $inc: { norganisations: -1 }
              }
            },
          },
        ])
      ])
      .then(() => null)
      .catch(e => console.log(e))
    },

    joinOrganisation(parent, { id }, { currentUser }) {
      const userOrg = currentUser.organisations.id(id)

      // User has already join the organisation and acknowledged
      if (userOrg && userOrg.ack) return currentUser;

      // User has not acknowledged
      if (userOrg && !userOrg.ack) {
        return Promise.all([
          models.Organisation.findByIdAndUpdate(id,
            {
              "$inc": {
                nusers: 1,
                nwt_ack: -1,
              }
            }, { new: true }
          ),
          models.User.updateOne(
            {
              "_id": currentUser._id,
              "organisations._id": id
            },
            {
              "$set": {
                "organisations.$.ack": true,
              },
            }
          ),
          models.Registration.updateOne(
            {
              "user._id": currentUser._id,
              "organisation._id": id,
            },
            {
              ack: true
            }
          )
        ])
        .then(([ organisation ]) => organisation)
        .catch(e => console.log(e));
      }

      // User has not yet join the organisation
      return models.Organisation.findById(id)
        .then(organisation => {
          if (!organisation) return new Error('Organisation Not Found');
          if (organisation.private) return new Error('Forbidden');

          return Promise.all([
            Promise.resolve(organisation),
            models.Organisation.updateOne(
              {
                _id: id,
              },
              {
                "$inc": {
                  nwt_confirm: 1,
                }
              }
            ),
            models.User.updateOne(
              {
                _id: currentUser._id,
              },
              {
                $push: {
                  organisations: Object.assign({}, organisation.toObject(), { ack: true, confirm: false })
                },
              }
            ),
            models.Registration.updateOne(
              {
                "user._id": currentUser._id,
                "organisation._id": id,
              },
              {
                "$set": {
                  "organisation": organisation,
                  "user": currentUser,
                  "ack": true,
                  "confirm": false,
                }
              },
              { upsert: true }
            )
          ])
        })
        .then(([organisation]) => organisation)
        .catch(e => console.log(e));
    },

    addUserToOrganisation(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${id}:add_user`)) return new Error('Forbidden');

      return models.Organisation.findById(id)
      .then(organisation => {
        if (!organisation) return new Error('Organisation Not Found');
        // --- Invite by USERID
        if (input.userId) {
          return models.User.findById(input.userId)
          .then(user => {
            if (!user) return new Error('User Not Found');
            return inviteUsers([ user ], organisation)
          })
          .catch(e => console.log(e));
        }
        // --- Invite by EMAIL
        if (input.email) {
          return models.User.findOneAndCreate({ email: input.email }, { email: input.email }, { new: true, upsert: true })
          .then(user => {
            return inviteUsers([ user ], organisation)
          })
          .catch(e => console.log(e));
        }
        // --- Invite with an array of EMAILS
        if (input.emails) {
          return models.User.bulkWrite(input.emails.map(e => ({
            updateOne: {
              filter: { email: e },
              update: {
                $set : { email: e },
              },
              upsert: true,
            }
          })), { ordered: false })
          .then(() => models.User.find({ email: { $in: input.emails } }))
          .then(users => {
            return inviteUsers(users, organisation)
          })
          .catch(e => console.log(e));
        }
      })

      return new Error('Bad Request');
    },

    removeUserFromOrganisation(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${id}:removeUser`)) return new Error('Forbidden');

      return removeUsers([input.userId], id)
      .then(organisation => {
        console.log(organisation)
        return organisation
      })
        .catch(e => console.log(e));
    },

    setRoleInOrganisation(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${id}:set_${input.role}_role`)) return new Error('Forbidden');

      return Promise.all([
        models.User.update(
          {
            _id: input.userId,
            organisations: {
              $elemMatch: { _id: id }
            }
          }, {
            "organisations.$.role": input.role,
          }
        ),
        models.Registration.update(
          {
            "user._id": input.userId,
            "organisation._id": id,
          }, {
            "role": input.role,
          }
        )
      ])
      .then(() => {
        return models.Organisation.findById(id);
      })
      .catch(e => {
        console.log(e);
      })
    }
  },
}
