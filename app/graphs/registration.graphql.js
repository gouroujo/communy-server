const Registration = /* GraphQL */`
extend type Query {
  registration (
    organisationId: ID!
    userId: ID!
  ): Registration
}
extend type Mutation {
  setRoleToRegistration (
    userId: ID!
    organisationId: ID!
    role: OrganisationRole!
  ): Registration!
}

type Registration {
  id: ID!
  role: OrganisationRole
  permissions: [String!]!
  joined: Boolean!
  ack: Boolean!
  confirm: Boolean!
  createdAt: DateTime!
  user: User
  organisation: Organisation

  participation (
    eventId: ID!
  ): Participation

  participations (
    after: DateTime
    before: DateTime
    answer: EventAnswer
    answers: [EventAnswer!]
    limit: Int
    offset: Int
  ): [Participation!]

  nparticipations (
    after: DateTime
    before: DateTime
    answer: EventAnswer
    answers: [EventAnswer!]
  ): Int!
}
`;

module.exports = () => [Registration]
