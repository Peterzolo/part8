const { ApolloServer, gql } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { v1: uuid } = require("uuid");
const { GraphQLError } = require("graphql");
const mongoose = require("mongoose");
const { databaseConnection } = require("./src/config/database");
mongoose.set("strictQuery", false);

const Author = require("./src/model/Author");

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
}

type Book {
  _id: ID!
  title: String!
  author: Author!
}

input AuthorInput {
  name: String!
  username: String!
  password: String!
  born: Int
  bookCount: Int
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
}

type Query {
  getAuthor(id: ID!): Author
  getAllAuthors: [Author]
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

    loginAuthor: async (_, { loginInput }) => {
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

        return author;
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
});

startStandaloneServer(server, {
  listen: { port: 5000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
