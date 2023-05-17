const mongoose = require("mongoose");

const uniqueValidator = require("mongoose-unique-validator");
const AuthorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: 4,
  },
  born: {
    type: Number,
  },
  bookCount: {
    type: Number,
  },
  books: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
  },
});

AuthorSchema.plugin(uniqueValidator);

const Author = mongoose.model("Author", AuthorSchema);
module.exports = Author;
