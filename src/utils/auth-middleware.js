const jwt = require("jsonwebtoken");
const { GraphQLError } = require("graphql");

const isAuthenticated = (resolve, _, args, context) => {
  const { req, res } = context;

  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split("Bearer ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.authorId = decoded.authorId;
      return resolve(_, args, context);
    } catch (error) {
      throw new GraphQLError("Invalid or expired token");
    }
  } else {
    throw new GraphQLError("Authentication required");
  }
};

module.exports = {
  isAuthenticated,
};
