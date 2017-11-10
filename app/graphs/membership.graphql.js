const Membership = /* GraphQL */`
type Membership {
  id: ID!
  user: User!
  network: Network!
  role: OrganisationRole
  ack: Boolean!
  confirm: Boolean!
  joined: Boolean!
}
`;

module.exports = () => [Membership]
