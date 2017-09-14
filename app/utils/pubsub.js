const PubSub = require('@google-cloud/pubsub');
const config = require('../config');

module.exports = {
  publishMessage : function(topicName, data) {
    // Instantiates a client
    const pubsub = PubSub({ projectId: config.get('GCLOUD_PROJECT') });
    return Promise.resolve()
      .then(() => {
        return new Promise((res, rej) => {
           pubsub.topic(topicName).get({ autoCreate: true }, function(err, topic) {
            if (err) rej(err);
            res(topic);
          })
        })
      })
      .then(topic => {
        // Create a publisher for the topic (which can include additional batching configuration)
        return topic.publisher()
      })
      .then(publisher => {
        const dataBuffer = Buffer.from(data);
        return publisher.publish(dataBuffer)
      })
      .then(results => {
        const messageId = results[0];
        console.log(`Message ${messageId} published.`);
        return messageId;
      })
  }
}
