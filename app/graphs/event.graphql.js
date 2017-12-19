const Participation = require('./participation.graphql')

const Event = /* GraphQL */`
extend type Query {
  events (
    organisationId: ID
    answer: EventAnswer
    answers: [EventAnswer!]
    limit: Int
    offset: Int
    after: DateTime
    before: DateTime
  ): [Event!]

  event (
    id: ID!
  ): Event!
}

extend type Mutation {
  createEvent (
    input: EventCreateInput!
    organisationId: ID!
  ): Event!

  deleteEvent (
    id: ID!
  ): Event

  editEvent (
    id: ID!
    input: EventEditInput!
  ): Event!

  addUserToEvent (
    id: ID!
    input: addUserToEventInput!
  ): Event!

}

type Event {
  id: ID!
  title: String!
  description: String
  address: Address
  startTime: DateTime!
  endTime: DateTime!

  duration: String!
  allDay: Boolean
  open: Boolean!
  organisation: Organisation!

  nanswer: Int
  nusers: Int!

  nno: Int
  nmb: Int
  nyes: Int

  participations(
    limit: Int
    offset: Int
    yes: Boolean
    no: Boolean
    mb: Boolean
  ): [Participation!]

  address: Address
  participation (
    userId: ID
  ): Participation

  networks (
    limit: Int
    offset: Int
  ): [Network!]
}

input EventCreateInput {
  title: String!
  description: String
  address: AddressInput
  parts: [EventPartInput!]!
  networkIds: [ID!]
  allNetwork: Boolean
  open: Boolean
}
input EventEditInput {
  title: String
  description: String
  address: AddressInput
  parts: [EventPartInput!]
  networkIds: [ID!]
  allNetwork: Boolean
  open: Boolean
}

input EventPartInput {
  startTime: DateTime!
  endTime: DateTime!
  allDay: Boolean
}

input addUserToEventInput {
  userId: ID
  answer: EventAnswer!
}
`;

module.exports = () => [Event, Participation]
