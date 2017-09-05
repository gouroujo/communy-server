const { omit, difference } = require('lodash');
const { models, mongoose } = require('../db');

const getFieldNames = require('../utils/getFields');
const filterEvents = require ('../utils/filterEvents');
const signCloudinary = require('../utils/signCloudinary');
const minifyUser = require('../utils/minifyUser');
const minifyOrganisation = require('../utils/minifyOrganisation');

const setRoleInOrganisation = require('../tasks/setRoleInOrganisation');
const registerToOrganisation = require('../tasks/registerToOrganisation');
const removeFromOrganisation = require('../tasks/removeFromOrganisation');

const { orgMemberStatus, orgStatus, CLOUDINARY_KEY } = require('../config');

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

    nusers(organisation) {
      return organisation.nusers;
    },

    nwaitingAck(organisation) {
      return organisation.nwt_ack;
    },

    nwaitingConfirm(organisation) {
      return organisation.nwt_confirm;
    },

    role(organisation, args, { currentUser }) {
      if (!currentUser) return null;
      if (organisation.role) return organisation.role;
      const org = currentUser.organisations.find(o => (String(o.ref) === String(organisation._id)));
      return org ? org.role : null;
    },

    isWaitingAck(organisation, args, { currentUser }) {
      if (!currentUser) return false;
      if (organisation.ack === false) return true;

      const org = currentUser.organisations.find(o => (String(o.ref) === String(organisation._id)));
      return org ? !org.ack : false
    },

    isWaitingConfirm(organisation, args, { currentUser }) {
      if (!currentUser) return false;
      if (organisation.ack && !organisation.role) return true;
      const org = currentUser.organisations.find(o => (String(o.ref) === String(organisation._id)));
      return org ? (org.ack && !org.role) : false
    },

    joined(organisation, args, { currentUser }) {
      if (!currentUser) return false;
      if (organisation.ack && organisation.role) return true;
      const org = currentUser.organisations.find(o => (String(o.ref) === String(organisation._id)));
      return org ? !!(org.ack && org.role) : false
    },

    joinedAt(organisation) {
      return organisation.t || null;
    },

    users(organisation, { role, limit, waiting_ack, waiting_confirm }, { currentUser }, info) {
      if (!currentUser) return new Error('Unauthorized');

      let users;
      if (waiting_ack) {
        if (!currentUser.permissions.check(`organisation:${organisation._id}:addUser`)) return new Error('Forbidden');
        users = organisation.wt_ack;
      } else if (waiting_confirm) {
        if (!currentUser.permissions.check(`organisation:${organisation._id}:addUser`)) return new Error('Forbidden');
        users = organisation.wt_confirm;
      } else {
        users = organisation.users
      }
      // return users.map(user => ({
      //   id: user.ref,
      //   fullname: user.fullname,
      //   avatar: user.avatar,
      //   role: user.role,
      // }));
      return users.map(user => Object.assign(user, { organisationId: organisation._id }));
    },

    user(organisation, { id }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');

      let user = organisation.users.find(u => (String(u.ref) === id));
      if (user) return Object.assign(user, { wt_ack: false, wt_confirm: false, organisationId: organisation._id });

      user = organisation.wt_ack.find(u => (String(u.ref) === id));
      if (user) return Object.assign(user, { wt_ack: true, wt_confirm: false, organisationId: organisation._id });

      user = organisation.wt_confirm.find(u => (String(u.ref) === id));
      if (user) return Object.assign(user, { wt_ack: false, wt_confirm: true, organisationId: organisation._id });

      if (!user) return new Error('User Not Found');
    },

    nevents(organisation) {
      if (!organisation.events) return 0;
      return organisation.events.length;
    },

    events(organisation, { after, before, limit, offset }, { currentUser }, info) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${organisation._id}:event_list`)) return new Error('Forbidden');

      const query = models.Event.find({
        "organisation.ref": organisation._id
      })

      if (after) query.gte('endTime', after)
      if (before) query.lte('startTime', before)
      return query.limit(limit).skip(offset).lean().exec()
    },

    coverUploadOpts(organisation) {
      if(!organisation || !organisation._id) return null;

      const options = {
        api_key: CLOUDINARY_KEY,
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
    organisations(_, { status, limit, offset }) {
      return models.Organisation.find({ status })
        .skip(offset)
        .limit(limit)
        .lean();
    },

    organisation(_, { id }) {
      return models.Organisation.findById(id).lean()
    },
  },

  Mutation: {
    createOrganisation(_, { input }, { currentUser }) {
      return minifyUser(currentUser, { role: orgStatus.ADMIN })
        .then(user => models.Organisation.create(Object.assign({}, input, {
          nusers: 1,
          users: [user]
        })))
        .then(organisation =>
          minifyOrganisation(organisation, { role: orgStatus.ADMIN , ack: true })
          .then(o => models.User.findByIdAndUpdate(currentUser.id, {
            $push: { organisations:  o},
            $inc: { norganisations: 1 },
          }))
          .then(() => organisation)
        )
        .catch(e => console.log(e))
    },

    editOrganisation(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${id}:edit`)) return new Error('Forbidden');

      return models.Organisation.findByIdAndUpdate(
        id,
        input,
        { new: true }
      )
    },

    deleteOrganisation(parent, { id }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${id}:delete`)) return new Error('Forbidden');

      return models.Organisation.findByIdAndRemove(id)
        .then(organisation => {
          return Promise.all([
            models.Event.bulkWrite([
              {
                deleteMany: {
                  filter: {
                    "organisation.ref": organisation.id
                  }
                }
              },
            ]),
            models.User.bulkWrite([
              {
                deleteMany: {
                  filter: {
                    userCreated: { $ne: true },
                    organisations: {
                      $elemMatch: { ref: organisation.id },
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
                          { ref: organisation.id, ack: false },
                          { ref: organisation.id, role: null },
                        ]
                      },
                    },
                    $or: [{ "organisations.1": { $exists: true } }, { userCreated: true }],
                  },
                  update: {
                    $pull: { organisations: { ref: organisation.id } },
                  }
                },
              },
              {
                updateMany: {
                  filter: {
                    organisations: {
                      $elemMatch: { ref: organisation.id, ack: true, role: { $exists: true, $ne: null } },
                    },
                    $or: [{ "organisations.1": { $exists: true } }, { userCreated: true }],
                  },
                  update: {
                    $pull: { organisations: { ref: organisation.id } },
                    $inc: { norganisations: -1 }
                  }
                },
              },
            ])
          ])
          .then(() => organisation);
        })
        .catch(e => console.log(e))
    },

    addUserToOrganisation(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${id}:addUser`)) return new Error('Forbidden');
      // ----
      if (input.userId) {
        return models.User.findById(input.userId)
          .then(user => registerToOrganisation(user, id))
          .then(() => models.Organisation.findById(id))
          .catch(e => console.log(e));
      }
      // ----
      if (input.email) {
        return models.User.findOneAndCreate({ email: input.email }, { email: input.email }, { new: true, upsert: true })
          .then(user => registerToOrganisation(user, id))
          .then(() => models.Organisation.findById(id))
          .catch(e => console.log(e));
      }
      // ----
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
        .then(() => models.User.find({ email: { $in: input.emails }}))
        .then(users => registerToOrganisation(users, id))
        .then(() => models.Organisation.findById(id))
        .catch(e => console.log(e));
      }
      // ----
      return new Error('Bad Request');
    },

    removeUserFromOrganisation(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${id}:removeUser`)) return new Error('Forbidden');

      return removeFromOrganisation(input.userId, id)
        .then(() => models.Organisation.findById(id))
        .catch(e => console.log(e));
    },

    setRoleInOrganisation(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${id}:setRole`)) return new Error('Forbidden');

      return setRoleInOrganisation(input.userId, id, input.role)
        .then(() => models.Organisation.findById(id))
        .catch(e => console.log(e));
    }
  },
}
