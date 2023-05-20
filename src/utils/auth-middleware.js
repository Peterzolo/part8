const jwt = require("jsonwebtoken");
const { promisify } = require("util");

exports.isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new Error("Unauthorized");
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    req.authorId = decoded.authorId;

    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};
