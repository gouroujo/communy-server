const { omit, difference } = require('lodash');
const { models } = require('../db');
const getFieldNames = require('../utils/getFields');
// const { addToOrganisation, candidateToOrganisation, registerToOrganisation } = require('../tasks/addToOrganisation');

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
        'id', 'title', 'logo', 'ack', 'role', 'joinedAt', '__typename'
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
    events(user, { before, after, limit, offset, organisationId }, { currentUser }, info) {
      if (!user) return [];
      const query =models.Event.find({
        yes: {
          "$elemMatch": { ref: user._id || user.id }
        }
      });
      if (after) query.gte('endTime', after)
      if (before) query.lte('startTime', before)
      //       if (organisationId && currentUser.organisations.includes(organisationId)) {
      if (organisationId) {
        query.where('organisation._id').equals(organisationId)
      } else {
        query.in('organisation._id',
          currentUser.organisations
          // .filter(o => checkOrgPermission(o.status, 'events:list'))
          .map(o => o._id))
      }
      return query.sort('endTime').limit(limit).skip(offset).lean().exec()
    }
  },

  Query: {
    user(parent, { id }) {
      return models.User.findById(id);
    },
    me(parent, args, { currentUser }) {
      return currentUser;
    }
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
      return candidateToOrganisation(currentUser.id, id)
        .then(organisation => {
          currentUser.organisations.push(organisation)
          return models.User.findById(currentUser.id)
        })
    },

    answerToEvent(parent, { eventId, answer }, { currentUser }) {
      console.log(answer)
      if (!currentUser) return new Error('Unauthorized');

      return models.Event.findById(eventId)
        .then(event => {
          if (!event) return new Error('Not found');
          if (input.answer === 'YES') {
            return answerYesToEvent(currentUser, event)
          } else if (input.answer === 'NO') {
            return answerNoToEvent(currentUser, event)
          } else if (input.answer === 'MAYBE') {
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
