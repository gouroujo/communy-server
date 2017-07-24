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
    role(organisation, args, { currentUser }) {
      if (!currentUser) return null;
      if (organisation.role) return organisation.role;

      const org = currentUser.organisations.find(o => (String(o.ref) === String(organisation._id)));
      return org ? org.role : null;
    },
    waiting_ack(organisation, args, { currentUser }) {
      if (!currentUser) return false;
      if (organisation.ack === false) return true;

      const org = currentUser.organisations.find(o => (String(o.ref) === String(organisation._id)));
      return org ? !org.ack : false
    },
    waiting_confirm(organisation, args, { currentUser }) {
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
    users(organisation, args, ctx, info) {
      return organisation.users;
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
      const organisation = new models.Organisation(input);

      return minifyUser(currentUser, {
        role: orgStatus.ADMIN,
        ack: false,
      }).then(u => {
        organisation.nusers = 1;
        organisation.users = [u];
        return organisation.save();
      });
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
    },

    addUserToOrganisation(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${id}:addUser`)) return new Error('Forbidden');
      if (!input.userId && !input.email) return new Error('Bad Request');

      return (input.userId ?
        models.User.findById(userId) : models.User.findOneAndCreate({ email: input.email }, { email: input.email }, { new: true, upsert: true })
      ).then(user => {
        return registerToOrganisation(user, id);
      }).then(() => models.Organisation.findById(id));
    },

    setRoleInOrganisation(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (!currentUser.permissions.check(`organisation:${id}:setRole`)) return new Error('Forbidden');

      return setRoleInOrganisation(input.userId, id, input.role).then(() => models.Organisation.findById(id));
    }
  },
}
