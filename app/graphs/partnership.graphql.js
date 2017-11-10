const Partnership = /* GraphQL */`
type Partnership {
  id: ID!
  organisation: Organisation!
  network: Network!
  ack: Boolean!
  confirm: Boolean!
  joined: Boolean!
}
`;

module.exports = () => [Partnership]
