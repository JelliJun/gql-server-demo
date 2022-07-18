import { ApolloServer, gql } from 'apollo-server';

const typeDefs = gql`
  type Agency {
    identity: ID!
    name: String!
  }
  
  type Query {
    allAgencies: [Agency!]!
    singleAgency(id: ID!): Agency
  }

  type Mutation {
    create(name: String!): Agency!
    delete(identity: ID!): Boolean!
  }
`;

const server = new ApolloServer({ typeDefs });

server.listen().then(({ url }) => {
  console.log(`running on ${url}`);
});