const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { v1: uuid } = require("uuid");
const { GraphQLError } = require("graphql");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const Book = require("./src/model/book");

require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connection to MongoDB:", error.message);
  });

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
      title: String!
      published: Int!
      author: String!
      genres: [String]!
    ): Books

    editNumber(
      name: String!
      phone: String!
    ): Person

    createUser(
      username: String!
    ): User
    
    login(
      username: String!
      password: String!
    ): Token  
    
    addAsFriend(
      name: String!
    ): User
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
      const books = Book.find({});
      return books;
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
