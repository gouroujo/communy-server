const config = require('../config');
const { models, mongoose } = require('../db');
const cloudinary = require('cloudinaryClient');
const logger = require('logger');
const signCloudinary = require('../utils/signCloudinary');

module.exports = {
  Organisation: {
    id(organisation) {
      return organisation._id;
    },

    title(organisation, params, { getField }) {
      return getField('title', organisation, 'Organisation');
    },
    description(organisation, params, { getField }) {
      return getField('description', organisation, 'Organisation');
    },
    type(organisation, params, { getField }) {
      return getField('type', organisation, 'Organisation');
    },
    demo(organisation, params, { getField }) {
      return getField('demo', organisation, 'Organisation');
    },
    categories(organisation, params, { getField }) {
      return getField('categories', organisation, 'Organisation');
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

    registration(organisation, { userId }, { auth, currentUserId, loaders }) {
      if (
        !auth ||
        (userId && userId !== currentUserId && !auth.check(`organisation:${organisation._id}:user_view`))
      ) return null;

      return loaders.RegistrationLink.load({
        "organisation._id": organisation._id,
        "user._id": userId || currentUserId,
      })
    },

    registrations(organisation, { search, role, limit, offset, ack, confirm }, { auth }) {
      if (!auth || !auth.check(`organisation:${organisation._id}:user_list`)) return null;

      const query = models.Registration.find({
        "organisation._id": organisation._id,
      });

      if (typeof search !== 'undefined') query.where('user.fullname').regex(new RegExp(search, 'i'))
      if (typeof role !== 'undefined') query.where('role').equals(role)
      if (typeof ack !== 'undefined') query.where('ack').equals(ack)
      if (typeof confirm !== 'undefined') query.where('confirm').equals(confirm)

      return query
        .sort('user.fullname')
        .limit(limit)
        .skip(offset)
        .lean()
        .exec();
    },

    partnership(organisation, { networkId }, { auth, loaders }) {
      if (
        !auth || !auth.check(`organisation:${organisation._id}:partnership_view`)
      ) return null;

      return loaders.OrganisationPartnershipForNetwork(networkId).load(organisation._id)
    },

    partnerships(organisation, { search, limit, offset, ack, confirm}, { auth }) {
      if (!auth || !auth.check(`organisation:${organisation._id}:partnership_list`)) return null;

      const query = models.Partnership.find({
        "organisation._id": organisation._id,
      });

      if (typeof search !== 'undefined' && search !== '') query.where('network.title').regex(new RegExp(search, 'i'))
      if (typeof confirm !== 'undefined') query.where('confirm').equals(confirm)
      if (typeof ack !== 'undefined') query.where('ack').equals(ack)

      return query
        .sort('network.title')
        .limit(limit)
        .skip(offset)
        .lean()
        .exec();
    },

    nevents(organisation) {
      return organisation.nevents || 0
    },

    events(organisation, { after, before, limit, offset }, { auth }) {
      if (!auth || !auth.check(`organisation:${organisation._id}:event_list`)) return null;

      const query = models.Event.find({
        "organisation._id": organisation._id
      })

      if (after) query.gte('endTime', after)
      if (before) query.lte('startTime', before)
      return query.sort('endTime').limit(limit).skip(offset).lean().exec()
    },

    mailings(organisation) {
      return models.Mailing.find({ "organisation._id": organisation._id })
    },

    logoUploadOpts(organisation, params, { auth }) {
      if (!auth || !auth.check(`organisation:${organisation._id}:upload_logo`)) return null;

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

    coverUploadOpts(organisation, params, { auth }) {
      if (!auth) return null;
      if (!auth.check(`organisation:${organisation._id}:upload_cover`)) return null;

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
    organisations(_, { limit, offset, search }) {
      const query = models.Organisation.find({
        type: { "$ne": 'secret' }
      });

      if (typeof search !== 'undefined' && search !== '') query.where('title').regex(new RegExp(search, 'i'))
      return query.sort('title').skip(offset).limit(limit).lean().exec();
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

    async addNetworkToOrganisation(_, {id, networkId }, { auth }) {
      if (!auth) return null;
      if (!auth.check(`organisation:${id}:add_network`)) return null;

      try {
        const [
          network,
          organisation
        ] = await Promise.all([
          models.Network.findById(networkId, '_id title').lean().exec(),
          models.Organisation.findById(id, '_id title').lean().exec()
        ])
        if (!network || !organisation) return null;

        await models.Partnership.create({
          ack: true,
          confirm: false,
          organisation: {
            _id: organisation._id,
            title: organisation.title,
          },
          network: {
            _id: network._id,
            title: network.title,
          },
        });
        return organisation;
      } catch(e) {
        logger.error(e);
        return null
      }
    },
    async removeNetworkToOrganisation(_, {id, networkId }, { auth }) {
      if (!auth) return null;
      if (!auth.check(`organisation:${id}:remove_network`)) return null;

      try {
        const partnership = await models.Partnership.findOne({
          "organisation._id": id,
          "network._id": networkId
        });
        if (!partnership) return null;

        const [ organisation ] = await Promise.all([
          models.Organisation.findByIdAndUpdate(id, {
            $inc: {
              nnetworks: (partnership.ack && partnership.confirm) ? -1 : 0
            }
          }, { new: true }).lean().exec(),
          models.Network.updateOne(networkId, {
            $inc: {
              norganisations: (partnership.ack && partnership.confirm) ? -1 : 0
            }
          }).lean().exec(),
          partnership.remove()
        ]);

        return organisation;
      } catch(e) {
        logger.error(e);
        return null
      }
    },

    async ackNetworkToOrganisation(_, {id, networkId }, { auth }) {
      if (!auth) return null;
      if (!auth.check(`organisation:${id}:confirm_network`)) return null;

      try {
        const partnership = await models.Partnership.findOne({
          "organisation._id": id,
          "network._id": networkId,
          "ack": false,
        }, '_id');
        if (!partnership) return null;

        const [ organisation ] = await Promise.all([
          models.Organisation.findByIdAndUpdate(id, {
            $inc: {
              nnetworks: 1
            }
          }, { new: true }).lean().exec(),
          models.Network.updateOne(networkId, {
            $inc: {
              norganisations: 1
            }
          }).lean().exec(),
          partnership.update({ "ack": true })
        ])

        return organisation;
      } catch(e) {
        logger.error(e);
        return null
      }
    }
  },
}
