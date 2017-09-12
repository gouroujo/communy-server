const Root = /* GraphQL */`
scalar Date
scalar DateTime
scalar Time
scalar EventAnswer
scalar OrganisationRole

type Query {
  version: String
}

type Mutation {
  version: String
}
`;

module.exports = () => [Root]
