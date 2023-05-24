import { ApolloServer, ApolloError } from "apollo-server-express";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { PubSub } from "graphql-subscriptions";
import { GraphQLError, execute, subscribe } from "graphql";
import mongoose from "mongoose";
import dotenv from "dotenv";

import { databaseConnection } from "./src/config/database.js";
import { context } from "./src/context/context.js";
import { typeDefs } from "./schema/schema.js";
import { resolvers } from "./resolver/resolver.js";

dotenv.config();

mongoose.set("strictQuery", false);
databaseConnection();

const pubsub = new PubSub();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

  const httpServer = http.createServer(app);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  useServer(
    {
      schema: apolloServer.schema,
      execute,
      subscribe,
    },
    wsServer
  );

  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  httpServer.listen({ port: process.env.PORT || 5000 }, () => {
    console.log(
      `Server ready at http://localhost:${process.env.PORT || 5000}${
        apolloServer.graphqlPath
      }`
    );
  });
}

startApolloServer();
