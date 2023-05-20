import jwt from "jsonwebtoken";

export const context = ({ req }) => {
  const token = req.headers.authorization || "";
  console.log("NEW TOKEN");
  if (token) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      // Add the decoded token or user ID to the context object
      return { authorId: decodedToken.authorId };
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
  // If no token is provided, return an empty context object
  return {};
};
