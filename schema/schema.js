export const typeDefs = `

type Author {
  name: String
  username: String!
  born: Int
  bookCount: Int
  books: [Book]
  createdAt: String
  updatedAt: String
}

input AuthorInput {
  name: String!
  username: String!
  password: String!
  born: Int
}

input LoginInput {
  username: String!
  password: String!
}

type AuthPayload {
  author: Author
  token: String
}


type Book {
  title: String!
  author: Author
  published: Int
  genre: String
  id:ID
}

input BookInput {
  title: String!
  authorId: ID
  published: Int
  genre: String
}

input FilterInput {
  genre: String
}

type Subscription {
    newBook: Book
  }
  



type Mutation {
  createAuthor(authorInput: AuthorInput!): Author
  updateAuthor(id: ID!, authorInput: AuthorInput!): Author
  deleteAuthor(id: ID!): Author
  loginAuthor(loginInput: LoginInput!): AuthPayload
  addBook(bookInput: BookInput!): Book
}


type Query {
  getAuthor(id: ID!): Author
  getAllAuthors: [Author]
  getBook(id: ID!): Book
  getAllBooks: [Book]
  isAuthenticated: Boolean
  getBooksByGenre(genre: String!): [Book]
}
`;
