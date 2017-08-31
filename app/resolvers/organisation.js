const { omit, difference } = require('lodash');
const { models, mongoose } = require('../db');

const getFieldNames = require('../utils/getFields');
const filterEvents = require ('../utils/filterEvents');
const signCloudinary = require('../utils/signCloudinary');
const minifyUser = require('../utils/minifyUser');

const setRoleInOrganisation = require('../tasks/setRoleInOrganisation');
const registerToOrganisation = require('../tasks/registerToOrganisation');

const { orgMemberStatus, orgStatus, CLOUDINARY_KEY } = require('../config');

module.exports = {
  Organisation: {
    logo(organisation) {
      return organisation.logo || organisation.logoUrl;
    },

    cover(organisation) {
      return organisation.cover || organisation.coverUrl;
    },

    id(organisation) {
      return organisation._id || organisation.id;
    },

    nusers(organisation) {
      if (!organisation.users) return 0;
      return organisation.users.length;
    },

    nwaitingAck(organisation) {
      if (!organisation.wt_ack) return 0;
      return organisation.wt_ack.length;
    },

    nwaitingConfirm(organisation) {
      if (!organisation.wt_confirm) return 0;
      return organisation.wt_confirm.length;
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
      return users;
    },

    user(organisation, { id }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');

      let user = organisation.users.find(u => (String(u.ref) === id));
      if (user) return Object.assign(user, { wt_ack: false, wt_confirm: false });

      user = organisation.wt_ack.find(u => (String(u.ref) === id));
      if (user) return Object.assign(user, { wt_ack: true, wt_confirm: false });

      user = organisation.wt_confirm.find(u => (String(u.ref) === id));
      if (user) return Object.assign(user, { wt_ack: false, wt_confirm: true });

      if (!user) return new Error('User Not Found');
    },

    nevents(organisation) {
      if (!organisation.events) return 0;
      return organisation.events.length;
    },

    events(organisation, args, ctx, info) {
      const fields = difference(getFieldNames(info), [
        'id', 'title', 'startTime', 'endTime'
      ])
      if (fields.length === 0) {
        return filterEvents(organisation.events, args).map(e => ({
          id: e._id,
          title: e.title,
          startTime: e.startTime,
          endTime: e.endTime,
        }))
      } else {
        const query = models.Event.find({
          _id: { $in: organisation.events.map(e => e._id ) }
        });
        if (args.after) query.gte('endTime', args.after)
        if (args.before) query.lte('startTime', args.before)
        return query.limit(args.limit).skip(args.offset).lean().exec()
      }
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
        .then(res => {
          if (res) return res;
          return {
            _id: mongoose.Types.ObjectId()
          };
        });
    },
  },

  Mutation: {
    createOrganisation(_, { input }, { currentUser }) {
      return models.Organisation.create(input)
        .then(organisation => {
          return setRoleInOrganisation(currentUser, organisation, orgStatus.ADMIN)
          .then(() => models.Organisation.findById(organisation.id));
        })
        .catch(e => {
          return new Error(e);
        })
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
      return models.Organisation.findByIdAndRemove(id);
    },

    addUserToOrganisation(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${id}:addUser`)) return new Error('Forbidden');
      // ----
      if (input.userId) {
        return models.User.findById(input.userId)
          .then(user => registerToOrganisation(user, id))
          .then(() => models.Organisation.findById(id));
      }
      // ----
      if (input.email) {
        return models.User.findOneAndCreate({ email: input.email }, { email: input.email }, { new: true, upsert: true })
          .then(user => registerToOrganisation(user, id))
          .then(() => models.Organisation.findById(id));
      }
      // ----
      if (input.emails) {
        return models.User.bulkWrite(input.emails.map(e => ({
          updateOne: {
            filter: { email: e },
            update: { $set : { email: e } },
            upsert: true,
          }
        })), { ordered: false })
        .then(() => models.User.find({ email: { $in: input.emails }}))
        .then(users => registerToOrganisation(users, id))
        .then(() => models.Organisation.findById(id));
      }
      // ----
      return new Error('Bad Request');
    },

    setRoleInOrganisation(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${id}:setRole`)) return new Error('Forbidden');

      return setRoleInOrganisation(input.userId, id, input.role).then(() => models.Organisation.findById(id));
    }
  },
}
