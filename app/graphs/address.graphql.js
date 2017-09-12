const Address = /* GraphQL */`
type Address {
  title: String
  street: String
  zipcode: String
  city: String
  country: String
  lat: Float
  lng: Float
  fulltext: String
}
`

module.exports = () => [Address]
