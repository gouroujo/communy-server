const Organisation = /* GraphQL */`
extend type Query {

  organisations (
    joined: Boolean
    limit: Int
    offset: Int
    role: OrganisationRole
  ): [Organisation!]

  organisation (
    id: ID!
  ): Organisation!

  createOrganisation: Organisation!
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

  joinOrganisation (
    id: ID!
  ) : Organisation!

  addUserToOrganisation(
    id: ID!
    input: AddUserToOrganisationInput!
  ): Organisation!

  removeUserFromOrganisation (
    id: ID!
    input: RemoveUserFromOrganisationInput!
  ): Organisation!

  setRoleInOrganisation(
    id: ID!
    input: SetRoleInOrganisationInput!
  ): Organisation!
}

type Organisation {
  id: ID!
  title: String
  description: String
  secret: Boolean
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

  role: OrganisationRole
  ack: Boolean!
  confirm: Boolean!

  nusers: Int!
  nack: Int!
  nconfirm: Int!
}

input OrganisationInput {
  title: String!
  description: String
  secret: Boolean!
  logo: String
  cover: String
}

input AddUserToOrganisationInput {
  email: String
  userId: ID
  emails: [String!]
}

input RemoveUserFromOrganisationInput {
  userId: ID!
}

input SetRoleInOrganisationInput {
  userId: ID!
  role: OrganisationRole!
}
`;

module.exports = () => [Organisation]
