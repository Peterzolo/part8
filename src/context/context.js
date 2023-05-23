import jwt from "jsonwebtoken";

export const context = ({ req }) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (token) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

      return { authorId: decodedToken.authorId };
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  return {};
};
