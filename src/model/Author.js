import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import bcrypt from "bcryptjs";

const AuthorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      minlength: 4,
    },
    username: {
      type: String,
      required: true,
    },
    password: { type: String, required: true },
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
  },
  { timestamps: true },

  {
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

AuthorSchema.pre("save", async function (next) {
  const hashedPassword = await bcrypt.hash(this.password, 10);
  this.password = hashedPassword;
  next();
});

AuthorSchema.plugin(uniqueValidator);

export const Author = mongoose.model("Author", AuthorSchema);
