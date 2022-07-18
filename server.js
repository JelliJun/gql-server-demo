import { ApolloServer, gql } from 'apollo-server';
import fetch from 'node-fetch';
import { hash } from 'rsvp';
import Auth from './auth.js';

const headers = {
  'X-Jelli-Authentication': Auth,
};

let agencies = [
  {
    name: 'Ad Infinitum',
    identity: '1',
    logoUrl: 'https://cdns3.jelli.com/ad_images/a457559d-b53e-4aa5-9290-18603939b343.png',
    advertisers: [ 'cc359cf2-5abc-46ba-808f-8893d71ab37f' ],
  },
  {
    name: 'Endicia',
    identity: '2',
    logoUrl: 'https://cdns3.jelli.com/ad_images/b7a1a94a-0e16-42af-bba3-a0d14ada5c3f.png',
    address: '385 Sherman Avenue \r\nPalo Alto, CA 94306-1864',
    advertisers: [],
  }
];

const typeDefs = gql`
  type Agency {
    identity: ID!
    name: String!
    logoUrl: String,
    address: String,
    advertisers: [Advertiser!]!
  }
  type Advertiser {
    identity: ID!
    name: String!
    active: Boolean
  }
  
  type Query {
    allAgencies: [Agency]!
    singleAgency(identity: ID!): Agency
    singleAdvertiser(identity: ID!): Advertiser
  }

  type Mutation {
    createAgency(name: String!, address: String, logoUrl: String): Agency!
    deleteAgency(identity: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    allAgencies() {
      let promises = {};
      agencies.forEach((agency) => {
        const advertiserIds = agency.advertisers || [];
        advertiserIds.forEach((identity) => {
          const promise = fetch(`https://api.dev.jelli.com/api/advertisers/${identity}`, { headers });
          promises[identity] = promise;
        });
      });

      return hash(promises).then((response) => {
        let resPromises = {};
        for (let key in response) {
          resPromises[key] = response[key].json();
        }
        return hash(resPromises).then((results) => {
          console.log(results);
          return agencies.map((agency) => {
            agency = Object.assign({}, agency);
            const advertiserIds = agency.advertisers;
            const advertisers = [];
            advertiserIds.forEach((identity) => {
              const advertiser = results[identity];
              if (advertiser) {
                advertisers.push(advertiser);
              }
            });
            agency.advertisers = advertisers;
            return agency;
          });
        });
      });
      
      
    },
    singleAgency(root, { identity }) {
      return agencies.find((agency) => agency.identity === identity);
    },
    singleAdvertiser(root, { identity }) {
      return fetch(`https://api.dev.jelli.com/api/advertisers/${identity}`, { headers }).then((response) => {
        return response.json();
      });
    }
  },
  Mutation: {
    createAgency(root, { name, address, logoUrl }) {
      const newAgency = {
        identity: `${agencies.length + 1}`,
        name,
        address,
        logoUrl
      }
      agencies.push(newAgency);
      return newAgency;
    },
    deleteAgency(root, { identity }) {
      console.log('agencies', agencies);
      const agency = agencies.find((agency) => agency.identity === identity);
      console.log('agency', agency);
      if (agency) {
        agencies = agencies.filter((agency) => agency.identity === identity);
        return true;
      }
      return false;
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`running on ${url}`);
});