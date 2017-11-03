const { omit, difference } = require('lodash');
const { models } = require('../db');
// const memcached = require('../memcached');
const getFieldNames = require('../utils/getFields');
const linkFacebook = require('../utils/linkFacebook');

module.exports = {
  User: {
    id(user) {
      return user._id || user.id;
    },

    hasCredentials(user) {
      return !!(user.password || user.facebookId)
    },

    fullname(user, args, { getField }) {
      return getField('fullname', user, 'User');
    },

    registrations(user, { role, limit, offset }, { getField }) {
      return getField('registrations', user, 'User');
    },

    answer(user, { eventId }, { currentUser, loaders }) {
      return loaders.Event.load(eventId)
      .then(event => {
        if (!event) return null;
        if (event.yes && event.yes.find(u => String(u._id) === String(user._id))) return 'yes';
        if (event.mb && event.mb.find(u => String(u._id) === String(user._id))) return 'mb';
        if (event.no && event.no.find(u => String(u._id) === String(user._id))) return 'no';
        return null;
      })
    },

    events(user, { before, after, limit, offset, organisationId, answer = 'yes' }, { currentUser }, info) {
      if (!user) return [];
      const query = models.Event.find({});
      query.select('-yes -no -mb');

      if (answer) query.where(answer).elemMatch({ _id : user._id || user.id });
      if (after) query.gte('endTime', after);
      if (before) query.lte('startTime', before);
      if (organisationId) {
        query.where('organisation._id').equals(organisationId);
      } else {
        query.in('organisation._id',
          currentUser.organisations.map(o => o._id)
        );
      }
      return query.sort('endTime').limit(limit).skip(offset).lean().exec();
    },

    messages(user, { limit, offset, organisationId, read }) {
      const query = models.Message.find({});
      query.where('to._id').equals(user._id);
      if (typeof read !== 'undefined') query.where('readAt').ne(null)
      if (organisationId) {
        query.where('organisation._id').equals(organisationId);
      }
      return query.sort('sendAt').limit(limit).skip(offset).lean().exec();
    },

    nunreadMessage(user) {
      return models.Message.count({
        "to._id": user.id,
        readAt: null
      })
    },
  },

  Query: {
    user(parent, { id, organisationId }, { currentUser, loaders }) {
      if (!currentUser) return new Error('Unauthorized');
      return loaders.User.load(id);
    },
    users(_, { organisationId, search, limit, offset }, { currentUser }) {
      const searchRegEx = new RegExp(search,'i');
      return models.User.find({
        $or: [
          { firstname: { $regex: searchRegEx } },
          { lastname: { $regex: searchRegEx } },
          { email: { $regex: searchRegEx } },
        ]
      })
      .limit(limit)
      .skip(offset)
      .lean()
      .exec()
    },

    me(parent, args, { currentUser, loaders }) {
      if (!currentUser) return null;
      return loaders.User.load(currentUser._id);
    },

  },

  Mutation: {
    async editUser(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      // TODO: id is not used at the moment

      if (input.facebookAccessToken && input.facebookId && input.facebookId !== currentUser.facebookId) {
        await linkFacebook(currentUser, {
          facebookId: input.facebookId,
          facebookAccessToken: input.facebookAccessToken
        })
      }
      currentUser.set(omit(input, ['facebookId']));
      return Promise.all([
        currentUser.save(),
        (
          (!input.email || input.email === currentUser.email) &&
          (!input.firstname || input.firstname === currentUser.firstname) &&
          (!input.lastname || input.lastname === currentUser.lastname)
        ) ? Promise.resolve() : (
          models.Registration.updateMany(
            {
              "user._id": currentUser._id
            },
            {
              "user.email": currentUser.email,
              "user.fullname": currentUser.fullname
            }
          )
        )
      ])
      .then(() => currentUser)
      .catch(e => console.log(e));
      // memcached.replace(user._id, user.toObject(), memcached.USER_CACHE_LIFETIME)
    },
  }
}
