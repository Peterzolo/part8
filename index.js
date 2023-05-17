const { ApolloServer, gql } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { v1: uuid } = require("uuid");
const { GraphQLError } = require("graphql");
const mongoose = require("mongoose");
const { databaseConnection } = require("./src/config/database");
mongoose.set("strictQuery", false);

const Book = require("./src/model/book");
const Author = require("./src/model/Author");

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
  Mutation: {
    addBook: async (_, { book }) => {
      try {
        const author = await Author.findOne({ name: book.author });

        if (!author) {
          // If the author doesn't exist, create a new author
          const newAuthor = new Author({
            name: book.author,
            born: null,
            bookCount: 1,
          });

          await newAuthor.save();

          const newBook = new Book({
            title: book.title,
            published: book.published,
            author: newAuthor._id,
            genres: book.genres,
          });

          await newBook.save();

          return newBook;
        } else {
          // If the author exists, increment the bookCount and create a new book
          author.bookCount += 1;
          await author.save();

          const newBook = new Book({
            title: book.title,
            published: book.published,
            author: author._id,
            genres: book.genres,
          });

          await newBook.save();

          return newBook;
        }
      } catch (error) {
        throw new GraphQLError(`Error adding book: ${error.message}`);
      }
    },

    addAuthor: async (_, { author }) => {
      try {
        const newAuthor = new Author({
          name: author.name,
          born: author.born,
          bookCount: author.bookCount || 0,
        });

        await newAuthor.save();

        return newAuthor;
      } catch (error) {
        throw new GraphQLError(`Error adding author: ${error.message}`);
      }
    },
  },

  Query: {
    // Implement your existing query resolvers here
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
