const Registration = /* GraphQL */`
type Registration {
  id: ID!
  role: OrganisationRole
  joined: Boolean!
  ack: Boolean!
  confirm: Boolean!
  createdAt: DateTime!
  user: User
  organisation: Organisation
}
`;

module.exports = () => [Registration]
