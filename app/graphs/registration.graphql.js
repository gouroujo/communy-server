const Registration = /* GraphQL */`
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
