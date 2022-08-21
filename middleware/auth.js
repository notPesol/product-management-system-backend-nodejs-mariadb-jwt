const jwt = require("jsonwebtoken");
const ResponseError = require("../utils/ResponseError");

const TOKEN_SECRET = process.env.TOKEN_SECRET;

const verifyToken = (req, res, next) => {
  const token = req.body.token || req.headers["x-access-token"] || "";

  if (!token) {
    throw new ResponseError(403, "Toekn is required for authentication.");
  }

  try {
    const decoded = jwt.verify(token, TOKEN_SECRET);
    console.log(decoded);
  } catch (error) {
    throw new ResponseError(401, "Invalid token.");
  }

  return next();
};

module.exports = {
  verifyToken,
};
