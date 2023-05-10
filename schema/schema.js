const graphql = require("graphql");

const { GraphQLObjectType, GraphQLString } = graphql;

const BookType = new GraphQLObjectType({
  name: "book",
  fields: () => ({
    type: { id: GraphQLString },
  }),
});
