const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

/**
 * returns boolean
 * true => username is NOT already taken
 * false => username already taken
 */
const isValid = (username)=>{ //returns boolean
  if (!username) return false;
  return !users.some((u) => u.username === username);
};

/**
 * returns boolean
 * true => username/password combo exists
 */
const authenticatedUser = (username,password)=>{ //returns boolean
  return users.some((u) => u.username === username && u.password === password);
};

//only registered users can login
regd_users.post("/login", (req, res) => {
  const username = req.body?.username;
  const password = req.body?.password;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid login. Check username/password." });
  }

  // Create JWT
  const accessToken = jwt.sign({ username }, "fingerprint_customer", {
    expiresIn: "1h",
  });

  // Store in session (session-level auth + JWT)
  req.session.authorization = { accessToken, username };

  return res.status(200).json({
    message: "Customer successfully logged in",
    token: accessToken,
  });
});

// Add/Modify a book review (authenticated)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;

  // Hint says review is passed as a query param
  const review = req.query.review;

  if (!review) {
    return res.status(400).json({ message: "Review query parameter is required. Example: ?review=Great%20book" });
  }

  const username = req.session?.authorization?.username;

  if (!username) {
    return res.status(401).json({ message: "User not logged in" });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (!books[isbn].reviews) {
    books[isbn].reviews = {};
  }

  // Add or update review by this username
  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: "Review added/updated successfully",
    isbn,
    reviews: books[isbn].reviews,
  });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session?.authorization?.username;

  if (!username) {
    return res.status(401).json({ message: "User not logged in" });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  const reviews = books[isbn].reviews || {};

  if (!reviews[username]) {
    return res.status(404).json({ message: "No review found for this user on this ISBN" });
  }

  delete reviews[username];
  books[isbn].reviews = reviews;

  return res.status(200).json({
    message: "Review deleted successfully",
    isbn,
    reviews: books[isbn].reviews,
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
module.exports._usersStore = users; // optional: helpful for debugging