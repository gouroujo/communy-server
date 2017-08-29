const { omit, difference } = require('lodash');
const { models } = require('../db');
const getFieldNames = require('../utils/getFields');
// const { addToOrganisation, candidateToOrganisation, registerToOrganisation } = require('../tasks/addToOrganisation');

const candidateToOrganisation = require('../tasks/candidateToOrganisation');
const { answerYesToEvent, answerMaybeToEvent, answerNoToEvent } = require ('../tasks/answerToEvent');

module.exports = {
  User: {
    id(user) {
      return user._id || user.id;
    },
    norganisations(user) {
      return user.organisations.length;
    },
    organisations(user, args, ctx, info) {
      const fields = difference(getFieldNames(info), [
        'id', 'title', 'logo', 'waiting_ack', 'waiting_confirm', 'role', 'joinedAt', '__typename'
      ])
      if (fields.length === 0) {
        return user.organisations.map(o => ({
          id: o.ref,
          title: o.title,
          logo: o.logo,
          ack: o.ack,
          role: o.role,
          t: o.t,
        }))
      } else {
        return models.Organisation.find({
          _id: { $in: user.organisations.map(org => org.ref ) }
        }).then(organisations => (
          organisations.map(organisation => {
            const uo = user.organisations.find(o => {
              return o.ref == organisation._id
            });
            return uo ? Object.assign({}, organisation, { ack: uo.ack, role: uo.role, t: uo.t }) : organisation;
          })
        ))
      }
    },
    events(user, { before, after, limit, offset, organisationId, answer }, { currentUser }, info) {
      if (!user) return [];
      const query = models.Event.find({});
      query.select('-yes -no -mb');

      if (answer) query.where(answer).elemMatch({ ref: user._id || user.id });
      if (after) query.gte('endTime', after);
      if (before) query.lte('startTime', before);
      if (organisationId) {
        query.where('organisation.ref').equals(organisationId);
      } else {
        query.in('organisation.ref',
          currentUser.organisations.map(o => o.ref)
        );
      }
      return query.sort('endTime').limit(limit).skip(offset).lean().exec();
    }
  },

  OrganisationUser: {
    fullname(user) {
      console.log(user)
      return `${user.firstname} ${user.lastname}`;
    },
    events(user, { before, after, limit, offset, answer }, { currentUser }, info) {
      return [];
    },
  },

  Query: {
    user(parent, { id, organisationId }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');
      return models.User.findById(id);
    },

    users(parent, { organisationId, limit, offset, search }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');

      // if (organisationId && ) return new Error('Forbidden');

      const query = search ? (
        models.User.find(
          { $text : { $search : search } },
          { score : { $meta: "textScore" } }
        ).sort({ score : { $meta : 'textScore' } })
      ) : (
        models.User.find().sort('firstname')
      );

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

    me(parent, args, { currentUser }) {
      return currentUser;
    },

  },

  Mutation: {
    updateProfile(parent, { input }) {
      return models.User.findByIdAndUpdate(
        input.id,
        omit(input, 'id'),
        { new: true }
      )
    },

    joinOrganisation(parent, { organisationId }, { currentUser }) {
      return models.Organisation.findById(organisationId)
        .then(organisation => {
          if (!organisation) return new Error('Not Found');
          return candidateToOrganisation(currentUser, organisationId)
            .then(() => {
              currentUser.organisations.push(organisation)
              return models.User.findById(currentUser.id)
            })
        })

    },

    answerToEvent(parent, { eventId, answer }, { currentUser }) {
      if (!currentUser) return new Error('Unauthorized');

      return models.Event.findById(eventId)
        .then(event => {
          if (!event) return new Error('Not found');
          if (answer === 'yes') {
            return answerYesToEvent(currentUser, event)
          } else if (answer === 'no') {
            return answerNoToEvent(currentUser, event)
          } else if (answer === 'mb') {
            return answerMaybeToEvent(currentUser, event)
          }
          return event;
        })
        .then(() => {
          return models.User.findById(currentUser.id);
        });
    }
  }
}
