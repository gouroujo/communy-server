const User = /* GraphQL */`
extend type Query {
  user: User
}

extend type Mutation {
  editUser (
    id: ID!
    input: UserInput!
  ): User!

  linkFacebookToUser (
    id: ID!
    input: linkFacebookToUserInput!
  ): User!

  joinOrganisationToUser (
    organisationId: ID!
  ) : User!

  ackOrganisationToUser (
    organisationId: ID!
  ) : User!

  leaveOrganisationToUser (
    organisationId: ID!
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
    after: Date
    before: Date
    answer: EventAnswer
    limit: Int
    offset: Int
  ): [Participation!]

  nparticipations (
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

input linkFacebookToUserInput {
  facebookId: String!
  facebookAccessToken: String!
}
`;

module.exports = () => [User]
