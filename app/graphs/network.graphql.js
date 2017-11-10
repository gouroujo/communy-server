const Network = /* GraphQL */`
type Network {
  id: ID!
  title: String
  description: String
  demo: Boolean
  nusers: Int
  norganisations: Int

  logo (
    width: Int
    height: Int
    radius: Int
  ): String
  cover (
    width: Int
    height: Int
    radius: Int
  ): String

  logoUploadOpts: String
  coverUploadOpts: String

  memberships (
    limit: Int
    offset: Int
  ): [Membership!]
  membership (
    userId: ID
  ): Membership

  partnerships (
    limit: Int
    offset: Int
  ): [Partnership!]
  partnership (
    organisationId: ID
  ): Partnership

}

extend type Query {
  networks (
    limit: Int
    offset: Int
    search: String
  ): [Network!]

  network (
    id: ID!
  ): Network
}
extend type Mutation {
  createNetwork (
    input: NetworkInput
  ): Network!

  editNetwork (
    id: ID!
    input: NetworkInput
  ): Network!

  deleteNetwork (
    id: NetworkInput
  ): Network

  addUsersToNetwork (
    id: ID!
    input: AddUsersToNetworkInput!
  ): Network!

  addOrganisationToNetwork (
    id: ID!
    organisationId: ID!
  ): Network!

  removeOrganisationToNetwork (
    id: ID!
    organisationId: ID!
  ): Network!

  confirmOrganisationToNetwork (
    id: ID!
    organisationId: ID!
  ): Network!
}

input NetworkInput {
  title: String!
  description: String
  logo: Int
  cover: Int
}

input AddUsersToNetworkInput {
  users: [OrganisationUserInput!]!
  message: String
}
`;

module.exports = () => [Network]
