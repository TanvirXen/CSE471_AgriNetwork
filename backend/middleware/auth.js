const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const xToken = req.header("x-auth-token");
  const authHeader = req.header("Authorization");
  let token = xToken;
  
  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
