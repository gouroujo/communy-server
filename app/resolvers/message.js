const { models } = require('../db');

module.exports = {
  Message: {
    id(message) {
      return message._id
    },
    user(message, params, { getField }) {
      return getField('to', message, 'Message');
    },
    mailing(message, params, { getField }) {
      return getField('mailing', message, 'Message');
    },
    body(message, params, { getField }) {
      return getField('body', message, 'Message');
    },
    subject(message, params, { getField }) {
      return getField('subject', message, 'Message');
    },
    sentAt(message, params, { getField }) {
      return getField('sentAt', message, 'Message');
    },
    readAt(message, params, { getField }) {
      return getField('readAt', message, 'Message');
    },
    // answers(message, params, { getField }) {
    //   return getField('sentAt', message, 'Message');
    // },
    nanswers(message, params, { getField }) {
      return getField('answers', message, 'Message')
        .then(answers => answers ? answers.length : 0)
    },
  },
  Query: {
    message(_, { id }, { currentUser, loaders }) {
      return loaders.Message.load(id);
    },
  },
  Mutation: {
    async readMessage(_, { id }, { currentUser }) {
      const message = await models.Message.findOne({
        _id: id,
        "to._id": currentUser._id,
      });

      if (!message) return null;
      if (message.readAt) return message;
      message.set('readAt', Date.now());
      return message.save();
    }
  }
}
