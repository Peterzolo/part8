const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Bookschema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 5,
    },
    genre: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
    },
    published: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

Bookschema.plugin(uniqueValidator);

const Book = mongoose.model("Book", Bookschema);

module.exports = Book;
