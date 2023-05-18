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
    born: Int!
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
      const { title, published, author: authorName, genres } = book;

      const existingBook = await Book.findOne({ title });
      if (existingBook) {
        throw new GraphQLError("Book with the same title already exists");
      }

      let author = await Author.findOne({ name: authorName });

      // Create a new author if they don't exist
      if (!author) {
        author = new Author({
          name: authorName,
          bookCount: 0,
        });
      }

      const newBook = new Book({
        title,
        published,
        genres,
        author: author._id,
      });

      author.bookCount += 1;
      await author.save();
      await newBook.save();

      return newBook;
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
