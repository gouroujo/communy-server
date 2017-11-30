const Organisation = /* GraphQL */`
extend type Query {
  organisations (
    joined: Boolean
    limit: Int
    offset: Int
    role: OrganisationRole
    search: String
    categories: [String!]
  ): [Organisation!]

  organisation (
    id: ID!
  ): Organisation
}

extend type Mutation {

  createOrganisation (
    input: OrganisationInput!
  ): Organisation!

  editOrganisation (
    id: ID!
    input: OrganisationInput!
  ): Organisation!

  deleteOrganisation (
    id: ID!,
  ): Organisation

  addUsersToOrganisation(
    id: ID!
    input: AddUsersToOrganisationInput!
  ): Organisation!

  confirmUserToOrganisation (
    id: ID!
    userId: ID!
  ): Organisation!

  removeUserToOrganisation (
    id: ID!
    userId: ID!
  ): Organisation!

  setUserRoleToOrganisation(
    id: ID!
    input: setUserRoleToOrganisationInput!
  ): Organisation!

  addNetworkToOrganisation (
    id: ID!
    networkId: ID!
  ): Organisation!

  removeNetworkToOrganisation (
    id: ID!
    networkId: ID!
  ): Organisation!

  ackNetworkToOrganisation (
    id: ID!
    networkId: ID!
  ): Organisation!
}

type Organisation {
  id: ID!
  title: String
  description: String
  type: String
  demo: Boolean
  categories: [String!]
  logo(
    width: Int
    height: Int
    radius: Int
  ): String
  cover(
    width: Int
    height: Int
    radius: Int
  ): String
  logoUploadOpts: String
  coverUploadOpts: String

  registration (
    userId: ID
  ): Registration

  registrations (
    role: OrganisationRole
    limit: Int
    offset: Int
    ack: Boolean
    confirm: Boolean
    search: String
  ): [Registration]

  events (
    before: DateTime
    after: DateTime
    limit: Int
    answer: EventAnswer
  ): [Event!]

  nevents (
    before: Date
    after: Date
    answer: EventAnswer
  ): Int!

  nusers: Int!
  nack: Int!
  nconfirm: Int!

  mailings: [Mailing]

  partnerships (
    limit: Int
    offset: Int
    ack: Boolean
    confirm: Boolean
    search: String
  ): [Partnership!]

  partnership (
    networkId: ID!
  ): Partnership

  nnetworks: Int
}

input OrganisationInput {
  title: String
  description: String
  type: String
  categories: [String!]
  logo: Int
  cover: Int
}

input AddUsersToOrganisationInput {
  users: [OrganisationUserInput!]!
  message: String
}

input setUserRoleToOrganisationInput {
  userId: ID!
  role: OrganisationRole!
}

input OrganisationUserInput {
  email: String!
  firstname: String
  lastname: String
}
`;

module.exports = () => [Organisation]
