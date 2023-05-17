const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { v1: uuid } = require("uuid");
const { GraphQLError } = require("graphql");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const Book = require("./src/model/book");

require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

const typeDefs = `
  type Books {
    title: String!
    published: Int!
    author: String!
    genres: [String]! 
    id: ID!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int!
    id: ID!
  }

  type Mutation {
    addBook(
      title: String
      author: String
      published: Int
      genres: [String]
    ): Books

    addAuthor(
      name: String
      born: String
    ): Author

    editAuthor(
      id: ID!
      born: Int!
    ): Author
  }


  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre : String): [Books!]!
    allAuthors: [Author!]!
    findBook(id: String!): Books
    findAuthor(id: String!): Author
  }
`;

const resolvers = {
  Query: {
    bookCount: async () => Book.collection.countDocuments(),

    allBooks: async (root, args) => {
      // filters missing
      return Book.find({});
    },
    findBook: async (root, args) => Book.findOne({ title: args.title }),
  },

  Mutation: {
    addBook: async (root, args) => {
      const book = new Book({ ...args });
      return book.save();
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 5000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
