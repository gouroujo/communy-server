const User = /* GraphQL */`
extend type Query {
  user (
    id: ID!
    organisationId: ID!
  ): User

  users (
    organisationId: ID
    limit: Int
    offset: Int
  ): [User!]

  searchUsers (
    emails: [String]!
    limit: Int
    offset: Int
  ): [User!]

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

  organisations (
    role: OrganisationRole
    limit: Int
    offset: Int
  ): [Organisation!]

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
}

type OrganisationUser {
  id: ID!
  ref: ID!
  firstname: String
  lastname: String
  fullname: String
  email: String
  avatar: String
  birthday: Date
  birthplace: String
  phone1: String
  phone2: String

  events (
    after: Date
    before: Date
    answer: EventAnswer
    limit: Int
    offset: Int
  ): [Event!]

  role: OrganisationRole
  isWaitingAck: Boolean!
  isWaitingConfirm: Boolean!
}

type EventUser {
  id: ID!
  firstname: String
  lastname: String
  fullname: String
  email: String
  avatar: String

  answer: EventAnswer
}

input UserInput {
  firstname: String
  lastname: String
  email: String
  password: String
  birthday: Date
  birthplace: String
  phone1: String
  phone2: String
}
`;

module.exports = () => [User]