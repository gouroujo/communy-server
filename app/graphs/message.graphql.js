const Message = /* GraphQL */`
extend type Query {
  message (
    id: ID!
  ): Message!
}

extend type Mutation {
  readMessage (
    id: ID!
  ): Message!

  deleteMessage (
    id: ID!
  ): Message
}

type Message {
  id: ID!
  subject: String
  body: String
  readAt: DateTime
  sentAt: DateTime
  user: User
  mailing: Mailing
  nanswers: Int!
}

input MessageInput {
  subject: String
  body: String
  to: ID!
  organisationId: ID
}
`;

module.exports = () => [Message]
