import { ApolloServer, ApolloError } from "apollo-server-express";
import express from "express";
import http from "http";

import cookieParser from "cookie-parser";

import cors from "cors";

import { GraphQLError } from "graphql";

import mongoose from "mongoose";

import jwt from "jsonwebtoken";

import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

mongoose.set("strictQuery", false);

import { databaseConnection } from "./src/config/database.js";
import { Author } from "./src/model/Author.js";
import { Book } from "./src/model/book.js";
import { context } from "./src/context/context.js";

databaseConnection();

const typeDefs = `

type Author {
  name: String
  username: String!
  born: Int
  bookCount: Int
  books: [Book]
  createdAt: String
  updatedAt: String
}

input AuthorInput {
  name: String!
  username: String!
  password: String!
  born: Int
}

input LoginInput {
  username: String!
  password: String!
}

type AuthPayload {
  author: Author
  token: String
}


type Book {
  title: String!
  author: Author
  published: Int
  genre: String
  id:ID
}

input BookInput {
  title: String!
  authorId: ID
  published: Int
  genre: String
}

input FilterInput {
  genre: String
}



type Mutation {
  createAuthor(authorInput: AuthorInput!): Author
  updateAuthor(id: ID!, authorInput: AuthorInput!): Author
  deleteAuthor(id: ID!): Author
  loginAuthor(loginInput: LoginInput!): AuthPayload
  addBook(bookInput: BookInput!): Book
}


type Query {
  getAuthor(id: ID!): Author
  getAllAuthors: [Author]
  getBook(id: ID!): Book
  getAllBooks: [Book]
  isAuthenticated: Boolean
  getBooksByGenre(genre: String!): [Book]
}
`;

const resolvers = {
  Mutation: {
    createAuthor: async (_, { authorInput }) => {
      try {
        const { username } = authorInput;
        const existingAuthor = await Author.findOne({ username });
        if (existingAuthor) {
          throw new Error("Author already exists");
        }
        const author = new Author(authorInput);
        await author.save();
        return author;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    updateAuthor: async (_, { id, authorInput }) => {
      try {
        const { born, ...restInput } = authorInput;

        const author = await Author.findByIdAndUpdate(id, restInput, {
          new: true,
        });
        if (!author) {
          throw new Error("Author not found");
        }
        if (born !== undefined) {
          author.born = born;
          await author.save();
        }
        return author;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    deleteAuthor: async (_, { id }) => {
      try {
        const author = await Author.findByIdAndRemove(id);
        if (!author) {
          throw new Error("Author not found");
        }
        return author;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    loginAuthor: async (_, { loginInput }, { req, res }) => {
      const { username, password } = loginInput;

      try {
        const author = await Author.findOne({ username });

        if (!author) {
          throw new Error("Invalid username or password");
        }

        const passwordMatch = await bcrypt.compare(password, author.password);
        if (!passwordMatch) {
          throw new Error("Invalid username or password");
        }

        const token = jwt.sign(
          { authorId: author._id },
          process.env.JWT_SECRET,
          {
            expiresIn: "1h",
          }
        );

        return { author, token };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    addBook: async (_, { bookInput }, { authorId }) => {
      try {
        if (!authorId) {
          throw new Error("Unauthorized: You must be logged in to add a book.");
        }

        const author = await Author.findById(authorId);

        if (!author) {
          throw new Error("Author not found");
        }

        const { title, published, genre } = bookInput;

        const book = {
          title,
          author: authorId,
          published,
          genre,
        };

        const savedBook = await Book.create(book);
        author.books.push(savedBook);
        await author.save();

        return savedBook;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
  Query: {
    getAuthor: async (_, { id }) => {
      try {
        const author = await Author.findById(id).populate("books");
        if (!author) {
          throw new Error("Author not found");
        }
        return author;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    getAllAuthors: async () => {
      try {
        const authors = await Author.find().populate("books");
        return authors;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    getBook: async (_, { id }) => {
      try {
        const book = await Book.findById(id).populate("author");
        if (!book) {
          throw new Error("Book not found");
        }

        if (!book.author) {
          throw new Error("Author not found for the book");
        }

        return book;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    getAllBooks: async () => {
      try {
        const books = await Book.find().populate("author");
        return books;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    getBooksByGenre: async (_, { genre }) => {
      try {
        const books = await Book.find({ genre });
        return books;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

const app = express();
app.use(cookieParser());
app.use(cors());

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: context,
  formatError: (error) => {
    if (error.originalError instanceof GraphQLError) {
      return new ApolloError(error.message, error.originalError.code);
    }
    return error;
  },
});

async function startApolloServer() {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: "/graphql" });
}

startApolloServer().then(() => {
  const httpServer = http.createServer(app);

  httpServer.listen({ port: 5000 }, () => {
    console.log(
      `Server ready at http://localhost:5000${apolloServer.graphqlPath}`
    );
  });
});
