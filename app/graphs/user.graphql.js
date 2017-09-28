const User = /* GraphQL */`
extend type Query {
  user (
    id: ID!
    organisationId: ID!
  ): User

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
  answer (eventId: ID): EventAnswer

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

input UserInput {
  firstname: String
  lastname: String
  email: String!
  password: String
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
