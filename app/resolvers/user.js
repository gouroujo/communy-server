const { omit, difference } = require('lodash');
const { models } = require('../db');
// const memcached = require('../memcached');
const getFieldNames = require('../utils/getFields');

module.exports = {
  User: {
    id(user) {
      return user._id || user.id;
    },

    fullname(user) {
      if (user.fullname) return user.fullname;
      if (!user.firstname && !user.lastname) return user.email;
      return `${user.firstname ? user.firstname : ''} ${user.lastname ? user.lastname : ''}`;
    },

    organisations(user, args, ctx, info) {
      const fields = difference(getFieldNames(info), [
        'id', 'title', 'logo', 'role', 'ack','confirm', '__typename'
      ])

      if (fields.length === 0) {
        return user.organisations;
      }

      return models.Organisation.find({
        _id: { $in: user.organisations.map(org => org._id) }
      }).then(organisations => {
        return organisations.map((organisation) => {
          return Object.assign({}, user.organisations.id(organisation._id), organisation.toObject())
        });
      })
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
    }
  },

  Query: {
    user(parent, { id, organisationId }, { currentUser, loaders }) {
      if (!currentUser) return new Error('Unauthorized');
      return loaders.User.load(id);
    },

    users(parent, { organisationId, limit, offset }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');

      // if (organisationId && ) return new Error('Forbidden');

      const query = models.User.find().sort('firstname');

      // let query;
      //
      // if (organisationId) {
      //   if (!currentUser.permissions.check(`organisation:${organisationId}:list_user`)) return new Error('Forbidden');
      //   query = models.User.find()
      //     .where('organisations').elemMatch({ ref: organisationId, role: { $ne: null }})
      //     .sort('firstname');
      // } else {
      //   if (!search) return new Error('Forbidden');
      //   query =
      //   query.mongooseOptions({ fields: 'firstname lastname'})
      // }

      return query.limit(limit).skip(offset).exec()
    },

    searchUsers(parent, { emails, limit, offset }, { currentUser }) {
      return models.User.find({
        email: { $in: emails }
      })
      .limit(limit)
      .skip(offset)
      .lean()
      .exec()
      .then(users => {
        return emails.map(email => {
          return users.find(u => u.email === email) || { email }
        });
      });
    },

    me(parent, args, { currentUser, loaders }) {
      if (!currentUser) return null;
      return loaders.User.load(currentUser._id);
    },

  },

  Mutation: {
    editUser(parent, { id, input }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      if (id !== String(currentUser.id)) return new Error('Forbidden');

      return models.User.findByIdAndUpdate(id,input, { new: true })
      .then(user => {
        return Promise.all([
          (!input.email && !input.firstname && !input.lastname) ? Promise.resolve() : (
            models.Registration.updateMany(
              {
                "user._id": user._id
              },
              {
                "user.email": user.email,
                "user.fullname": user.fullname
              }
            )
          )//,
          // memcached.replace(user._id, user.toObject(), memcached.USER_CACHE_LIFETIME)
        ])
        .then(() => user)
      })
    },
  }
}
