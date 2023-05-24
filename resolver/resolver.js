import { Author } from "../src/model/Author.js";
import { Book } from "../src/model/book.js";
import jwt from "jsonwebtoken";

import bcrypt from "bcryptjs";

export const resolvers = {
  Mutation: {
    createAuthor: async (_, { authorInput }) => {
      try {
        const { username } = authorInput;
        const existingAuthor = await Author.findOne({ username });
        if (existingAuthor) {
          throw new Error("Author already exists");
        }
        const author = new Author(authorInput);
        await author.save();
        return author;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    updateAuthor: async (_, { id, authorInput }) => {
      try {
        const { born, ...restInput } = authorInput;

        const author = await Author.findByIdAndUpdate(id, restInput, {
          new: true,
        });
        if (!author) {
          throw new Error("Author not found");
        }
        if (born !== undefined) {
          author.born = born;
          await author.save();
        }
        return author;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    deleteAuthor: async (_, { id }) => {
      try {
        const author = await Author.findByIdAndRemove(id);
        if (!author) {
          throw new Error("Author not found");
        }
        return author;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    loginAuthor: async (_, { loginInput }, { req, res }) => {
      const { username, password } = loginInput;

      try {
        const author = await Author.findOne({ username });

        if (!author) {
          throw new Error("Invalid username or password");
        }

        const passwordMatch = await bcrypt.compare(password, author.password);
        if (!passwordMatch) {
          throw new Error("Invalid username or password");
        }

        const token = jwt.sign(
          { authorId: author._id },
          process.env.JWT_SECRET,
          {
            expiresIn: "1h",
          }
        );

        return { author, token };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    addBook: async (_, { bookInput }, { authorId }) => {
      try {
        if (!authorId) {
          throw new Error("Unauthorized: You must be logged in to add a book.");
        }

        const author = await Author.findById(authorId);

        if (!author) {
          throw new Error("Author not found");
        }

        const { title, published, genre } = bookInput;

        const book = {
          title,
          author: authorId,
          published,
          genre,
        };

        const savedBook = await Book.create(book);
        author.books.push(savedBook);
        await author.save();

        pubsub.publish("NEW_BOOK", { newBook: savedBook });

        return savedBook;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
  Query: {
    getAuthor: async (_, { id }) => {
      try {
        const author = await Author.findById(id).populate("books");
        if (!author) {
          throw new Error("Author not found");
        }
        return author;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    getAllAuthors: async () => {
      try {
        const authors = await Author.find().populate("books");
        return authors;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    getBook: async (_, { id }) => {
      try {
        const book = await Book.findById(id).populate("author");
        if (!book) {
          throw new Error("Book not found");
        }

        if (!book.author) {
          throw new Error("Author not found for the book");
        }

        return book;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    getAllBooks: async () => {
      try {
        const books = await Book.find().populate("author");
        return books;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    getBooksByGenre: async (_, { genre }) => {
      try {
        const books = await Book.find({ genre });
        return books;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },

  Subscription: {
    newBook: {
      subscribe: () => pubsub.asyncIterator(["NEW_BOOK"]),
    },
  },
};
