import express from "express";
import path from "path";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import chatRoutes from "./routes/chatRoutes";
import messageRoutes from "./routes/messageRoutes";
import { clerkMiddleware } from "@clerk/express";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(express.json()); // pareses incoming json request bodies and makes them available in req.body

app.use(clerkMiddleware()); // this middleware is used to authenticate the requests

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/chats", chatRoutes);
app.use("/api/v1/messages", messageRoutes);

//error handler must come after all the routes and other middlewares so they can catch errors passes with next(err)
// or thrown inside the async handlers.
app.use(errorHandler);

//serve frontend in production
if (process.env.NODE_ENV === "production") {
  // __dirname is the current directory name which is src
  app.use(express.static(path.join(__dirname, "../../web/dist")));

  //this route is used to serve the index.html file
  // anything except the api routes will hit this route and serve the frontend
  app.get("/{*any}", (_req, res) => {
    res.sendFile(path.join(__dirname, "../../web/dist/index.html"));
  });
}

export default app;
