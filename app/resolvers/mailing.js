const { models } = require('../db');

module.exports = {
  Mailing: {
    id(mailing) {
      return mailing._id;
    },
    messages(mailing, params, { getField }) {
      return getField('messages', mailing, 'Mailing')
    },
    nmessages(mailing, params, { getField }) {
      return getField('messages', mailing, 'Mailing')
        .then(messages => messages ? messages.length : 0);
    },
    organisation(mailing, params, { getField }) {
      return getField('organisation', mailing, 'Mailing')
    },
  },
  Query: {
    mailing(_, { id }, { currentUser, loaders }) {
      return loaders.Mailing.load(id);
    },
    mailings(_, { organisationId }, { currentUser }) {
      return models.Mailing.find({ organisationId });
    },
  },
  Mutation: {
    async createAndSendMailing(_, { input }, { currentUser, loaders }) {
      const [
        organisation,
        users
      ] = await Promise.all([
        loaders.Organisation.load(input.organisationId),
        models.User.find({ _id: { $in: input.receipients }}, 'firstname lastname email').lean().exec()
      ])

      const date = Date.now();

      const mailing = await models.Mailing.create({
        organisation: {
          _id: organisation._id,
          title: organisation.title,
        },
        from: {
          _id: currentUser._id,
          fullname: currentUser.fullname,
        },
        body: input.body,
        subject: input.subject,
        messages: [],
        sentAt: date,
      });

      const messages = await models.Message.insertMany(users.map(user => ({
        to: {
          _id: user._id,
          fullname: (user.firstname || user.lastname) ? `${user.firstname + ' ' || ''}${user.lastname || ''}` : user.email,
        },
        mailing: mailing.toObject(),
        sentAt: date,
        body: input.body, // TODO: parse body for placeholder
        subject: input.subject, // TODO: parse subject for placeholder
        answers: [],
      })));

      mailing.set('messages', messages.map(m => m.toObject()))
      return mailing.save();
    },
  }
}
