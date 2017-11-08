const { omit } = require('lodash');
const { models } = require('../db');
const cloudinary = require('../cloudinary');

// const memcached = require('../memcached');
const linkFacebook = require('../utils/linkFacebook');

module.exports = {
  User: {
    id(user) {
      return user._id;
    },
    hasCredentials(user, params, { getField }) {
      return Promise.all([
        getField('password', user, 'User'),
        getField('facebookId', user, 'User')
      ]).then(([password, facebookId]) => {
        return !!(password || facebookId)
      })
    },
    firstname(user, params, { getField }) {
      return getField('firstname', user, 'User');
    },
    lastname(user, params, { getField }) {
      return getField('lastname', user, 'User');
    },
    email(user, params, { getField }) {
      return getField('email', user, 'User');
    },
    birthday(user, params, { getField }) {
      return getField('birthday', user, 'User');
    },
    birthplace(user, params, { getField }) {
      return getField('birthplace', user, 'User');
    },
    phone1(user, params, { getField }) {
      return getField('phone1', user, 'User');
    },
    phone2(user, params, { getField }) {
      return getField('phone2', user, 'User');
    },

    fullname(user, args, { getField }) {
      if (user.fullname) return user.fullname;
      return Promise.all([
        getField('firstname', user, 'User'),
        getField('lastname', user, 'User'),
        getField('email', user, 'User')
      ]).then(([firstname, lastname, email]) => {
        return (firstname || lastname) ? `${firstname || ''} ${lastname || ''}` : email;
      })
    },

    registrations(user, { role, limit, offset }, { getField }) {
      return getField('registrations', user, 'User');
    },

    participations(user, { before, after, limit, offset, organisationId, answer }, { auth, currentUserId }) {
      const query = models.Participation.find({});

      if (user._id === currentUserId) {
        query.where('user._id').equals(currentUserId);
      } else if (organisationId && auth.check(`organisation:${organisationId}:event_add_user`)) {
        query.where('user._id').equals(user._id);
        query.where('organisation._id').equals(organisationId);
      } else {
        return null;
      }

      if (answer) query.where('answer').equals(answer);
      if (after) query.gte('event.endTime', after);
      if (before) query.lte('event.startTime', before);

      return query.sort('event.endTime').limit(limit).skip(offset).lean().exec();
    },

    async participation(user, { eventId }, { loaders, auth, currentUserId }) {
      try {
        const participation = await loaders.UserParticipationForEvent(eventId).load(user._id);
        if (!participation) return null;
        if ((user._id !== currentUserId) && !auth.check(`organisation:${participation.organisation._id}:event_add_user`)) {
          return null;
        }

        return participation;
      } catch(e) {
        console.log(e);
        return null;
      }
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
        "to._id": user._id,
        readAt: null
      })
    },

    avatar(user, { width, height, radius }) {
      if (!user._id) return null;
      return cloudinary.url(`users/${user._id}/avatar.jpg`,{
        gravity: "center",
        height: height ? Math.min(height, 300) : 40,
        radius,
        width: width ? Math.min(width, 300) : 40,
        crop: 'fit',
        default_image: 'avatar',
        sign_url: true,
        secure: true,
        version: user.avatar ? user.avatar : null
      })
    },
  },

  Query: {
    user(parent, { id, organisationId }, { auth, loaders }) {
      if (!auth) return null;
      return loaders.User.load(id);
    },
    users(_, { organisationId, search, limit, offset }) {
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

    me(parent, args, { currentUserId, loaders }) {
      if (!currentUserId) return null;
      return loaders.User.load(currentUserId);
    },

  },

  Mutation: {
    async editUser(parent, { id, input }, { currentUserId, loaders }) {
      if (!currentUserId) return null;
      // TODO: id is not used at the moment
      const currentUser = loaders.User.load(currentUserId)
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
