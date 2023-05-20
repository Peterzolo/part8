import jwt from "jsonwebtoken";

export const context = async ({ req }) => {
  const token = req.headers.authorization;
  if (token) {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      req.authorId = decodedToken.authorId;
    } catch (error) {
      throw new Error("Invalid token");
    }
  } else {
    throw new Error("Authorization token not found");
  }
};
