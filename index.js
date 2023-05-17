const { ApolloServer, gql } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { v1: uuid } = require("uuid");
const { GraphQLError } = require("graphql");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const Book = require("./src/model/book");
const Author = require("./src/model/Author");
const { MONGODB_URI, databaseConnection } = require("./src/config/database");

require("dotenv").config();

databaseConnection();

const typeDefs = `
  input BookInput {
    title: String!
    published: Int!
    author: String!
    genres: [String]!
  }

  input AuthorInput {
    name: String!
    born: Int
    bookCount: Int
  }

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
    books: [Book!]!
    id: ID!
  }

  type Mutation {
    addBook(book: BookInput!): Book
    addAuthor(author: AuthorInput!): Author
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
    // Existing query resolvers...
  },
  Mutation: {
    addBook: async (root, { book }) => {
      const { title, published, author, genres } = book;

      // Create a new book document
      const newBook = new Book({ title, published, genres });

      // Find or create the corresponding author
      let existingAuthor = await Author.findOne({ name: author });
      if (!existingAuthor) {
        existingAuthor = new Author({ name: author });
        await existingAuthor.save();
      }

      // Associate the book with the author
      existingAuthor.books.push(newBook);
      await existingAuthor.save();

      // Save the book and return it
      newBook.author = existingAuthor;
      await newBook.save();
      return newBook;
    },
    addAuthor: async (root, { author }) => {
      const { name, born, bookCount } = author;

      // Create a new author document
      const newAuthor = new Author({ name, born, bookCount });

      // Save the author and return it
      await newAuthor.save();
      return newAuthor;
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
