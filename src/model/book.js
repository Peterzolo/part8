import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

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

export const Book = mongoose.model("Book", Bookschema);
