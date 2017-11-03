const Message = require('./message.graphql');

const Mailing = /* GraphQL */`
extend type Query {
  mailings (
    organisationId: ID!
  ): [Mailing!]

  mailing (
    id: ID!
  ): Mailing!
}

extend type Mutation {
  createAndSendMailing (
    input: MailingInput
  ): Mailing!

  deleteMailing (
    id: ID!
  ): Mailing
}

type Mailing {
  id: ID!
  subject: String
  body: String
  messages: [Message!]
  nmessages: Int!
  sentAt: DateTime
  organisation: Organisation

}

input MailingInput {
  subject: String
  body: String
  receipients: [ID!]
  organisationId: ID!
}
`;

module.exports = () => [Mailing, Message]
