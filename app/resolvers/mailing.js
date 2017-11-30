const { models } = require('../db');
const config = require('../config');
// const pubsub = require('../utils/pubsub');

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
    mailing(_, { id }, { loaders }) {
      return loaders.Mailing.load(id);
    },
    mailings(_, { organisationId }, { auth }) {
      return models.Mailing.find({ organisationId });
    },
  },
  Mutation: {
    async createAndSendMailing(_, { input }, { currentUserId, loaders }) {
      try {
        const [
          organisation,
          users,
          currentUser
        ] = await Promise.all([
          loaders.Organisation.load(input.organisationId),
          models.User.find({ _id: { $in: input.receipients }}, 'firstname lastname email').lean().exec(),
          loaders.User.load(currentUserId)
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

        const messages = users.map(user => ({
          to: {
            _id: user._id,
            fullname: (user.firstname || user.lastname) ? `${user.firstname + ' ' || ''}${user.lastname || ''}` : user.email,
            email: user.email,
          },
          mailing: mailing.toObject(),
          body: input.body, // TODO: parse body for placeholder
          subject: input.subject, // TODO: parse subject for placeholder
          answers: [],
        }));

        // if (!config.get('PUBSUB_TOPIC_EMAIL')) {
        //   console.log('No pubsub topic defined to send emails. messages not send');
        // } else {
        //   await Promise.all([
        //     messages.map(message => pubsub.publishMessage(config.get('PUBSUB_TOPIC_EMAIL'), {
        //       organisation: {
        //         id: organisation.id,
        //         title: organisation.title,
        //       },
        //       user: {
        //         fullname: message.to.fullname,
        //         email: message.to.email,
        //       },
        //       message: message.body,
        //       title: message.subject,
        //       subject: 'message',
        //     })
        //     .then(() => message.sentAt = Date.now())
        //     .catch(e => console.log(e)))
        //   ])
        // }

        const insertedMessages = await models.Message.insertMany(messages);
        mailing.set('messages', insertedMessages.map(m => m.toObject()));
        return mailing.save();
      } catch (e) {
        console.log(e);
        return null;
      }
    },
  }
}
