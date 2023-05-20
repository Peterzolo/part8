import jwt from "jsonwebtoken";

const getUser = async (token) => {
  try {
    if (token) {
      const user = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
      return user;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const context = async ({ req, res }) => {
  //   console.log(req.body.operationName);
  if (req.body.operationName === "IntrospectionQuery") {
    // console.log('blocking introspection query..');
    return {};
  }
  // allowing the 'CreateUser' and 'Login' queries to pass without giving the token
  if (
    req.body.operationName === "CreateUser" ||
    req.body.operationName === "Login"
  ) {
    return {};
  }

  // get the user token from the headers
  const token = req.headers.authorization || "";

  // try to retrieve a user with the token
  const user = await getUser(token);

  if (!user) {
    throw new Error("User not fount");
  }

  // add the user to the context
  return { user };
};
