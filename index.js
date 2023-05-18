// const { ApolloServer, gql } = require("@apollo/server");
const { ApolloServer, gql } = require("apollo-server-express");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { v1: uuid } = require("uuid");
const { GraphQLError } = require("graphql");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { databaseConnection } = require("./src/config/database");
mongoose.set("strictQuery", false);
const cookieParser = require("cookie-parser");
const express = require("express");
const cors = require("cors");

const Author = require("./src/model/Author");
const authenticated = require("./src/utils/auth-middleware");

require("dotenv").config();

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
  author: Author!
  published: Int
  genre : String

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
  authorId: ID!
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
  createBook(bookInput: BookInput!): Book
}


type Query {
  getAuthor(id: ID!): Author
  getAllAuthors: [Author]
  getBook(id: ID!): Book
  getAllBooks: [Book]
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

        res.cookie("token", token, {
          httpOnly: true,
          maxAge: 3600000,
        });

        return { ...author._doc, token };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    createBook: async (_, { bookInput }) => {
      try {
        const author = await Author.findById(authorId);
        if (!author) {
          throw new Error("Author not found");
        }

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
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => ({ req, res }),
});
const app = express();

app.use(cookieParser());
app.use(cors());
app.use("/graphql", authenticated);

server.start().then(() => {
  server.applyMiddleware({ app, path: "/graphql" });

  app.listen({ port: 5000 }, () => {
    console.log(`Server ready at http://localhost:5000${server.graphqlPath}`);
  });
});
