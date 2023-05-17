const { ApolloServer, gql } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { v1: uuid } = require("uuid");
const { GraphQLError } = require("graphql");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const Book = require("./src/model/book");
const Author = require("./src/model/Author");

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

const typeDefs = gql`
  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String]!
    id: ID!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int!
    books: [Book!]! # Define the books field as an array of Book type
    id: ID!
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String]!
    ): Book
    # ... other mutations ...
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    findBook(id: String!): Book
    findAuthor(id: String!): Author
  }
`;

const resolvers = {
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      const books = await Book.find({}).populate("author");
      return books;
    },
    findBook: async (root, args) => Book.findOne({ title: args.title }),
  },

  Author: {
    books: async (parent) => {
      const books = await Book.find({ author: parent.id });
      return books;
    },
  },

  Mutation: {
    addBook: async (root, args) => {
      const book = new Book({ ...args });
      return book.save();
    },
    // ... other mutations ...
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
