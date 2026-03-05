const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

app.use("/customer/auth/*", function auth(req, res, next) {
  const sessionToken = req.session?.authorization?.accessToken;

  const authHeader = req.headers.authorization; // "Bearer <token>"
  const headerToken =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

  const token = sessionToken || headerToken;

  if (!token) {
    return res.status(401).json({
      message: "Missing auth token. Login and send Authorization: Bearer <token>.",
    });
  }

  try {
    const decoded = jwt.verify(token, "fingerprint_customer");
    req.user = decoded.username; // attach username to request
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid/expired token." });
  }
});
 
const PORT =5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));
