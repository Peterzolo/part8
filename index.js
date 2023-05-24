import { ApolloServer, ApolloError } from "apollo-server-express";
import express from "express";
import http from "http";

import cookieParser from "cookie-parser";

import cors from "cors";

import { GraphQLError } from "graphql";

import mongoose from "mongoose";

import dotenv from "dotenv";

dotenv.config();

mongoose.set("strictQuery", false);

import { databaseConnection } from "./src/config/database.js";
import { Author } from "./src/model/Author.js";
import { Book } from "./src/model/book.js";
import { context } from "./src/context/context.js";
import { typeDefs } from "./schema/schema.js";
import { resolvers } from "./resolver/resolver.js";

databaseConnection();

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
