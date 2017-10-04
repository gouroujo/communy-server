const Event = /* GraphQL */`
extend type Query {
  events (
    organisationId: ID
    answer: EventAnswer
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
    input: EventInput!
    organisationId: ID!
  ): Event!

  deleteEvent (
    id: ID!
  ): Event

  editEvent (
    id: ID!
    input: EventInput!
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
  days: [String!]!
  allDay: Boolean
  organisation: Organisation!
  nanswer: Int
  nusers: Int!
  nno: Int
  nmb: Int

  users(
    limit: Int
    offset: Int
    yes: Boolean
    no: Boolean
    mb: Boolean
  ): [User!]

  address: Address
  answer: EventAnswer
}

input EventInput {
  title: String!
  description: String
  address: AddressInput
  startTime: DateTime!
  endTime: DateTime!
  allDay: Boolean
}

input addUserToEventInput {
  userId: ID
  answer: EventAnswer!
}
`;

module.exports = () => [Event]
