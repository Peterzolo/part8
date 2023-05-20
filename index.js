import { ApolloServer } from "apollo-server-express";
import express from "express";
import http from "http";

import cookieParser from "cookie-parser";

import cors from "cors";

import { startStandaloneServer } from "@apollo/server/standalone";

import { GraphQLError } from "graphql";

import mongoose from "mongoose";

import Jwt from "jsonwebtoken";

import bcrypt from "bcryptjs";

mongoose.set("strictQuery", false);

import { databaseConnection } from "./src/config/database.js";
import { Author } from "./src/model/Author.js";
import { Book } from "./src/model/book.js";
import { context } from "./src/context/context.js";

databaseConnection();

const typeDefs = `
type Author {
  _id: ID!
  name: String!
  username: String!
  password: String!
  born: Int
  bookCount: Int
  books: [Book]
  token: String
}

type Book {
  title: String!
  author: Author
  published: Int
  genre: String
}


input AuthorInput {
  name: String!
  username: String!
  password: String!
  born: Int
  bookCount: Int
}


input BookInput {
  title: String!
  authorId: ID
  published: Int
  genre: String
}

input LoginInput {
  username: String!
  password: String!
}


type Mutation {
  createAuthor(authorInput: AuthorInput!): Author
  updateAuthor(id: ID!, authorInput: AuthorInput!): Author
  deleteAuthor(id: ID!): Author
  loginAuthor(loginInput: LoginInput!): Author 
  addBook(bookInput: BookInput!): Book
}


type Query {
  getAuthor(id: ID!): Author
  getAllAuthors: [Author]
  getBook(id: ID!): Book
  getAllBooks: [Book]
  isAuthenticated: Boolean
}
`;

const resolvers = {
  Mutation: {
    createAuthor: async (_, { authorInput }) => {
      try {
        const author = new Author(authorInput);
        await author.save();
        return author;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    updateAuthor: async (_, { id, authorInput }) => {
      try {
        const author = await Author.findByIdAndUpdate(id, authorInput, {
          new: true,
        });
        if (!author) {
          throw new Error("Author not found");
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

        // Set the token in the authorization header
        res.setHeader("Authorization", `Bearer ${token}`);
        console.log("RES", res.setHeader("Authorization", `Bearer ${token}`));

        return { ...author._doc, token };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    // Update the addBook resolver signature to include 'context' as the third argument
    addBook: async (_, { bookInput }) => {
      try {
        const authorId = req.authorId; // Use req.authorId instead of req.author._id
        console.log("AUTHOR");
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
        const author = await Author.findById(id);
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
        const authors = await Author.find();
        return authors;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    getBook: async (_, { id }) => {
      try {
        const book = await Book.findById(id);
        if (!book) {
          throw new Error("Book not found");
        }
        return book;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    getAllBooks: async () => {
      try {
        const books = await Book.find();
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

// ...

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: context,
});

// Await server start before calling applyMiddleware
async function startApolloServer() {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });
}

startApolloServer().then(() => {
  const httpServer = http.createServer(app);

  httpServer.listen({ port: 5000 }, () => {
    console.log(
      `Server ready at http://localhost:5000${apolloServer.graphqlPath}`
    );
  });
});

// ...
