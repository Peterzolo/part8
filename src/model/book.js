const mongoose = require("mongoose");

const Bookschema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 5,
  },
  genres: {
    type: String,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "author",
    required: true,
  },
  published: {
    type: Number,
    required: true,
  },
});

const Book = mongoose.model("Person", Bookschema);

module.exports = Book;
