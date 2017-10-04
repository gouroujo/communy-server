const { find, pick, difference } = require('lodash');

const config = require('../config');
const { models } = require('../db');
const cloudinary = require('../cloudinary');

const getFieldNames = require('../utils/getFields');
const signCloudinary = require('../utils/signCloudinary');

module.exports = {
  Organisation: {
    id(organisation) {
      return organisation.ref || organisation._id || organisation.id;
    },

    logo(organisation, { width, height, radius }) {
      if (!organisation._id) return null;
      return cloudinary.url(`organisations/${organisation._id}/logo.jpg`,{
        gravity: "center",
        height: height ? Math.min(height, 300) : 150,
        radius,
        width: width ? Math.min(width, 300) : 150,
        crop: 'fit',
        default_image: 'logo',
        sign_url: true,
        secure: true,
        version: organisation.logo ? organisation.logo : null
      })
    },

    cover(organisation, { width, height, radius }) {
      if (!organisation._id) return null;
      return cloudinary.url(`organisations/${organisation._id}/cover.jpg`,{
        gravity: "center",
        height: height ? Math.min(height, 800) : 300,
        radius,
        width: width ? Math.min(width, 1000) : 840,
        crop: 'fill',
        default_image: 'cover.jpg',
        sign_url: true,
        secure: true,
        version: organisation.cover ? organisation.cover : null
      })
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

    registration(organisation, { userId }, { currentUser }, info) {
      if (!currentUser) return new Error('Unauthorized');

      const fields = difference(getFieldNames(info), [
        'joined', 'ack', 'confirm', 'role', '__typename'
      ])
      if (fields.length === 0) {
        return ((userId) ? models.User.findById(userId) : Promise.resolve(currentUser))
          .then(user => {
            if (!user.organisations) throw new Error('no organisations for user')
            const o = find(user.organisations, ['_id', organisation._id]);
            if (!o) throw new Error('organisation not found for user')
            return pick(o, ['ack', 'confirm', 'role'])
          })
          .catch(() => {
            return models.Registration.findOne({
              "organisation._id": organisation._id,
              "user._id": userId || currentUser._id,
            })
          })
      }

      return models.Registration.findOne({
        "organisation._id": organisation._id,
        "user._id": userId || currentUser._id,
      })

    },

    registrations(organisation, { search, role, limit, offset, ack, confirm }, { currentUser }, info) {
      if (!currentUser) return new Error('Unauthorized');

      const query = models.Registration.find({
        "organisation._id": organisation._id,
      });

      if (typeof search !== 'undefined') query.where('user.fullname').regex(new RegExp(search, 'i'))
      if (typeof role !== 'undefined') query.where('role').equals(role)
      if (typeof ack !== 'undefined') query.where('ack').equals(ack)
      if (typeof confirm !== 'undefined') query.where('confirm').equals(confirm)

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

    logoUploadOpts(organisation) {
      if(!organisation || !organisation._id) return null;

      const options = {
        api_key: config.get('CLOUDINARY_KEY'),
        timestamp: Date.now(),
        public_id: `organisations/${organisation._id}/logo`,
        overwrite: true,
        invalidate: true,
        tags: `logo,${organisation._id},organisation`,
        upload_preset: 'logo'
      };

      return JSON.stringify(Object.assign({}, options, {
        signature : signCloudinary(options)
      }));
    },

    coverUploadOpts(organisation) {
      if(!organisation || !organisation._id) return null;

      const options = {
        api_key: config.get('CLOUDINARY_KEY'),
        timestamp: Date.now(),
        public_id: `organisations/${organisation._id}/cover`,
        overwrite: true,
        invalidate: true,
        tags: `cover,${organisation._id},organisation`,
        upload_preset: 'cover'
      };

      return JSON.stringify(Object.assign({}, options, {
        signature : signCloudinary(options)
      }));
    }
  },

  Query: {
    organisations(_, { limit, offset }) {
      return models.Organisation.find({
        type: { "$ne": 'secret' }
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
    createOrganisation: require('./mutations/createOrganisation'),
    editOrganisation: require('./mutations/editOrganisation'),
    deleteOrganisation: require('./mutations/deleteOrganisation'),
    joinOrganisation: require('./mutations/joinOrganisation'),
    confirmUserToOrganisation: require('./mutations/confirmUserOrganisation'),
    addUsersToOrganisation: require('./mutations/addUsersOrganisation'),
    removeUserFromOrganisation: require('./mutations/removeUserOrganisation'),
    setRoleInOrganisation: require('./mutations/setRoleOrganisation'),
  },
}
