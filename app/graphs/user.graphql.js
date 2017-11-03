const User = /* GraphQL */`
extend type Query {
  users (
    organisationId: ID!
    search: String
    limit: Int
    offset: Int
  ): [User!]

  user (
    id: ID!
    organisationId: ID!
  ): User

  me: User
}

extend type Mutation {
  editUser (
    id: ID!
    input: UserInput!
  ): User!
}

type User {
  id: ID
  firstname: String
  lastname: String
  fullname: String
  email: String
  avatar: String
  birthday: Date
  birthplace: String
  phone1: String
  phone2: String
  hasCredentials: Boolean!
  answer (eventId: ID): EventAnswer

  registrations (
    role: OrganisationRole
    limit: Int
    offset: Int
  ): [Registration!]!

  norganisations (
    role: OrganisationRole
  ): Int!

  events (
    organisationId: ID
    after: Date
    before: Date
    answer: EventAnswer
    limit: Int
    offset: Int
  ): [Event!]

  nevents (
    organisationId: ID
    after: Date
    before: Date
    answer: EventAnswer
  ): Int!

  messages (
    read: Boolean
    limit: Int
    offset: Int
  ): [Message!]
  nunreadMessage: Int!
}

input UserInput {
  firstname: String
  lastname: String
  email: String
  password: String
  facebookId: String
  facebookAccessToken: String
  birthday: Date
  birthplace: String
  phone1: String
  phone2: String
}

input OrganisationUserInput {
  email: String!
  firstname: String
  lastname: String
}
`;

module.exports = () => [User]
