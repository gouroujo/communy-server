const Address = /* GraphQL */`
type Address {
  title: String
  road: String
  postcode: String
  city: String
  country: String
  country_code: String
  lat: Float
  lng: Float
  fulltext: String
}

input AddressInput {
  title: String
  road: String
  postcode: String
  city: String
  country: String
  country_code: String
  fulltext: String
}
`

module.exports = () => [Address]
