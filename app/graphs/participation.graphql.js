const Participation = /* GraphQL */`
type Participation {
  id: ID!
  answer: EventAnswer!
  user: User!
  event: Event!
  organisation: Organisation!
}
`;

module.exports = () => [Participation]
