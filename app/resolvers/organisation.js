const { find, pick, difference } = require('lodash');

const config = require('../config');
const { models, mongoose } = require('../db');
const cloudinary = require('../cloudinary');

const getFieldNames = require('../utils/getFields');
const signCloudinary = require('../utils/signCloudinary');

module.exports = {
  Organisation: {
    id(organisation) {
      return organisation._id;
    },

    title(organisation, params, { getField }) {
      return getField('title', organisation, 'Organisation');
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

    nusers(organisation, args, { getField }) {
      return getField('nusers', organisation, 'Organisation');
    },

    nack(organisation, args, { getField }) {
      return getField('nwt_ack', organisation, 'Organisation');
    },

    nconfirm(organisation, args, { getField }) {
      return getField('nwt_confirm', organisation, 'Organisation');
    },

    registration(organisation, { userId }, { currentUser, loaders }, info) {
      if (
        !currentUser ||
        (userId && userId !== currentUser._id && !currentUser.permissions.check(`organisation:${organisation._id}:user_view`))
      ) return null;

      return loaders.RegistrationLink.load({
        "organisation._id": organisation._id,
        "user._id": userId || currentUser._id,
      })
    },

    registrations(organisation, { search, role, limit, offset, ack, confirm }, { currentUser }, info) {
      if (!currentUser || !currentUser.permissions.check(`organisation:${organisation._id}:user_list`)) return null;

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
      if (!currentUser || !currentUser.permissions.check(`organisation:${organisation._id}:event_list`)) return null;

      const query = models.Event.find({
        "organisation._id": organisation._id
      })

      if (after) query.gte('endTime', after)
      if (before) query.lte('startTime', before)
      return query.limit(limit).skip(offset).lean().exec()
    },

    mailings(organisation) {
      return models.Mailing.find({ "organisation._id": organisation._id })
    },

    logoUploadOpts(organisation, params, { currentUser }) {
      if (!currentUser || !currentUser.permissions.check(`organisation:${organisation._id}:upload_logo`)) return null;

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

    coverUploadOpts(organisation, params, { currentUser }) {
      if (!currentUser) return null;
      if (!currentUser.permissions.check(`organisation:${organisation._id}:upload_cover`)) return null;

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

    organisation(_, { id }, { loaders }) {
      if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid ID');
      return loaders.Organisation.load(id);
    },
  },

  Mutation: {
    createOrganisation: require('./mutations/createOrganisation'),
    editOrganisation: require('./mutations/editOrganisation'),
    deleteOrganisation: require('./mutations/deleteOrganisation'),
    joinOrganisation: require('./mutations/joinOrganisation'),
    leaveOrganisation: require('./mutations/leaveOrganisation'),
    confirmUserToOrganisation: require('./mutations/confirmUserOrganisation'),
    addUsersToOrganisation: require('./mutations/addUsersOrganisation'),
    removeUserFromOrganisation: require('./mutations/removeUserOrganisation'),
    setRoleInOrganisation: require('./mutations/setRoleOrganisation'),
  },
}
