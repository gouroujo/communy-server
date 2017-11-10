const config = require('config');
const { models, mongoose } = require('db');
const cloudinary = require('cloudinaryClient');
const signCloudinary = require('utils/signCloudinary');
const logger = require('logger');

module.exports = {
  Network: {
    id(network) {
      return network._id;
    },

    title(network, params, { getField }) {
      return getField('title', network, 'Network');
    },
    description(network, params, { getField }) {
      return getField('description', network, 'Network');
    },
    demo(network, params, { getField }) {
      return getField('demo', network, 'Network');
    },

    logo(network, { width, height, radius }) {
      if (!network._id) return null;
      return cloudinary.url(`networks/${network._id}/logo.jpg`,{
        gravity: "center",
        height: height ? Math.min(height, 300) : 150,
        radius,
        width: width ? Math.min(width, 300) : 150,
        crop: 'fit',
        default_image: 'logo',
        sign_url: true,
        secure: true,
        version: network.logo ? network.logo : null
      })
    },

    cover(network, { width, height, radius }) {
      if (!network._id) return null;
      return cloudinary.url(`networks/${network._id}/cover.jpg`,{
        gravity: "center",
        height: height ? Math.min(height, 800) : 300,
        radius,
        width: width ? Math.min(width, 1000) : 840,
        crop: 'fill',
        default_image: 'cover.jpg',
        sign_url: true,
        secure: true,
        version: network.cover ? network.cover : null
      })
    },

    membership(network, { userId }, { auth, currentUserId, loaders }) {
      if (
        !auth ||
        (userId && userId !== currentUserId && !auth.check(`network:${network._id}:user_view`))
      ) return null;

      return loaders.NetworkMembershipForUser(userId || currentUserId).load(network._id)
    },

    memberships(network, { search, limit, offset, role, ack, confirm }, { auth }) {
      if (!auth || !auth.check(`network:${network._id}:user_list`)) return null;

      const query = models.Membership.find({
        "network._id": network._id,
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

    partnership(network, { organisationId }, { auth, loaders }) {
      if (
        !auth || !auth.check(`network:${network._id}:partnership_view`)
      ) return null;

      return loaders.NetworkPartnershipForOrganisation(organisationId).load(network._id)
    },

    partnerships(network, { search, limit, offset, confirm }, { auth }) {
      if (!auth || !auth.check(`network:${network._id}:partnership_list`)) return null;

      const query = models.Partnership.find({
        "network._id": network._id,
      });

      if (typeof search !== 'undefined') query.where('organisation.title').regex(new RegExp(search, 'i'))
      if (typeof confirm !== 'undefined') query.where('confirm').equals(confirm)

      return query
        .sort('organisation.title')
        .limit(limit)
        .skip(offset)
        .lean()
        .exec();
    },

    logoUploadOpts(network, params, { auth }) {
      if (!auth || !auth.check(`network:${network._id}:upload_logo`)) return null;

      const options = {
        api_key: config.get('CLOUDINARY_KEY'),
        timestamp: Date.now(),
        public_id: `networks/${network._id}/logo`,
        overwrite: true,
        invalidate: true,
        tags: `logo,${network._id},network`,
        upload_preset: 'logo'
      };

      return JSON.stringify(Object.assign({}, options, {
        signature : signCloudinary(options)
      }));
    },

    coverUploadOpts(network, params, { auth }) {
      if (!auth) return null;
      if (!auth.check(`network:${network._id}:upload_cover`)) return null;

      const options = {
        api_key: config.get('CLOUDINARY_KEY'),
        timestamp: Date.now(),
        public_id: `networks/${network._id}/cover`,
        overwrite: true,
        invalidate: true,
        tags: `cover,${network._id},network`,
        upload_preset: 'cover'
      };

      return JSON.stringify(Object.assign({}, options, {
        signature : signCloudinary(options)
      }));
    }
  },
  Query: {
    networks(_, { limit, offset, search }) {
      const query = models.Network.find({});
      if (typeof search !== 'undefined' && search !== '') query.where('title').regex(new RegExp(search, 'i'))
      return query.sort('title').skip(offset).limit(limit).lean();
    },

    network(_, { id }, { loaders }) {
      if (!mongoose.Types.ObjectId.isValid(id)) throw new Error('Invalid ID');
      return loaders.Network.load(id);
    },
  },
  Mutation: {
    createNetwork: require('./mutations/createNetwork'),
    editNetwork: require('./mutations/editNetwork'),
    // deleteOrganisation: require('./mutations/deleteOrganisation'),
    // joinOrganisation: require('./mutations/joinOrganisation'),
    // leaveOrganisation: require('./mutations/leaveOrganisation'),
    // confirmUserToOrganisation: require('./mutations/confirmUserOrganisation'),
    addUsersToNetwork: require('./mutations/addUsersNetwork'),
    // removeUserFromOrganisation: require('./mutations/removeUserOrganisation'),
    // setRoleInOrganisation: require('./mutations/setRoleOrganisation'),
    async addOrganisationToNetwork(_, {id, organisationId }, { auth }) {
      if (!auth) return null;
      if (!auth.check(`network:${id}:add_organisation`)) return null;

      try {
        const [
          network,
          organisation
        ] = await Promise.all([
          models.Network.findById(id, '_id title').lean().exec(),
          models.Organisation.findById(organisationId, '_id title').lean().exec()
        ])
        if (!network || !organisation) return null;

        await models.Partnership.create({
          ack: false,
          confirm: true,
          organisation: {
            _id: organisation._id,
            title: organisation.title,
          },
          network: {
            _id: network._id,
            title: network.title,
          },
        });
        return network;
      } catch(e) {
        logger.error(e);
        return null
      }
    },
    async removeOrganisationToNetwork(_, {id, organisationId }, { auth }) {
      if (!auth) return null;
      if (!auth.check(`network:${id}:remove_organisation`)) return null;

      try {
        const partnership = await models.Partnership.findOne({
          "organisation._id": organisationId,
          "network._id": id
        });
        if (!partnership) return null;

        const [ network ] = await Promise.all([
          models.Network.findByIdAndUpdate(id, {
            $inc: {
              norganisations: (partnership.ack && partnership.confirm) ? -1 : 0
            }
          }).lean().exec(),
          models.Organisation.updateOne(organisationId, {
            $inc: {
              nnetworks: (partnership.ack && partnership.confirm) ? -1 : 0
            }
          }).lean().exec(),
          partnership.remove()
        ]);

        return network;
      } catch(e) {
        logger.error(e);
        return null
      }
    },

    async confirmOrganisationToNetwork(_, { id, organisationId }, { auth }) {
      if (!auth) return null;
      if (!auth.check(`network:${id}:confirm_organisation`)) return null;

      try {
        const partnership = await models.Partnership.findOne({
          "organisation._id": organisationId,
          "network._id": id,
          "confirm": false,
        }, '_id');
        if (!partnership) return null;

        const [ network ] = await Promise.all([
          models.Network.findByIdAndUpdate(id, {
            $inc: {
              norganisations: 1
            }
          }).lean().exec(),
          models.Organisation.updateOne(organisationId, {
            $inc: {
              nnetworks: 1
            }
          }).lean().exec(),
          partnership.update({ "confirm": true })
        ])

        return network;
      } catch(e) {
        logger.error(e);
        return null
      }
    }
  },
}
