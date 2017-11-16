const Organisation = /* GraphQL */`
extend type Query {
  organisations (
    joined: Boolean
    limit: Int
    offset: Int
    role: OrganisationRole
    search: String
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

  confirmUserToOrganisation (
    id: ID!
    input: ConfirmUserOrganisationInput!
  ): Organisation!

  addUsersToOrganisation(
    id: ID!
    input: AddUsersToOrganisationInput!
  ): Organisation!

  removeUserToOrganisation (
    id: ID!
    input: RemoveUserToOrganisationInput!
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
    before: Date
    after: Date
    limit: Int
    answer: EventAnswer
  ): [Event!]

  nevents (
    before: Date
    after: Date
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

input ConfirmUserOrganisationInput {
  userId: ID!
}

input AddUsersToOrganisationInput {
  users: [OrganisationUserInput!]!
  message: String
}

input RemoveUserToOrganisationInput {
  userId: ID!
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
