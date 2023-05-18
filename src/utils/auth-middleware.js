const jwt = require("jsonwebtoken");
const Author = require("../model/Author");

const authenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new Error("Authentication required");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const author = await Author.findById(decodedToken.authorId);
    if (!author) {
      throw new Error("Invalid token");
    }

    req.author = author;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

module.exports = authenticated;
