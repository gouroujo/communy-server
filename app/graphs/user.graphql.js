const User = /* GraphQL */`
extend type Query {
  user: User
  me: User
}

extend type Mutation {
  editUser (
    input: UserInput!
  ): User!

  linkFacebookToUser (
    input: linkFacebookToUserInput!
  ): User!

  addOrganisationToUser (
    organisationId: ID!
  ) : User!

  ackOrganisationToUser (
    organisationId: ID!
  ) : User!

  removeOrganisationToUser (
    organisationId: ID!
  ) : User!

  signWithFacebook (
    input: linkFacebookToUserInput!
  ) : User!

  login (
    input: loginUserInput!
  ) : User!
  signin (
    input: SigninUserInput!
  ) : User!
}

type User {
  id: ID
  firstname: String
  lastname: String
  fullname: String
  email: String
  avatar: String
  avatarUploadOpts: String
  birthday: Date
  birthplace: String
  phone1: String
  phone2: String
  hasCredentials: Boolean!
  answer (eventId: ID): EventAnswer
  token: String

  registrations (
    role: OrganisationRole
    limit: Int
    offset: Int
  ): [Registration!]!

  registration (
    organisationId: ID!
  ): Registration

  memberships (
    limit: Int
    offset: Int
  ): [Membership!]!

  membership (
    networkId: ID!
  ): Membership

  norganisations: Int!
  nnetworks: Int!

  participation (
    eventId: ID!
  ): Participation

  participations (
    organisationId: ID
    after: DateTime
    before: DateTime
    answer: EventAnswer
    answers: [EventAnswer!]
    limit: Int
    offset: Int
  ): [Participation!]

  nparticipations (
    organisationId: ID
    after: DateTime
    before: DateTime
    answer: EventAnswer
    answers: [EventAnswer!]
  ): Int!

  messages (
    read: Boolean
    limit: Int
    offset: Int
  ): [Message!]
  nunreadMessage: Int
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

input SigninUserInput {
  firstname: String
  lastname: String
  email: String!
  password: String!
  birthday: Date
  birthplace: String
  phone1: String
  phone2: String
}

input linkFacebookToUserInput {
  facebookId: String!
  facebookAccessToken: String!
}

input loginUserInput {
  email: String!
  password: String!
}
`;

module.exports = () => [User]
