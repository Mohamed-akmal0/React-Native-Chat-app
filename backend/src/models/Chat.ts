import mongoose, { Schema, type Document } from "mongoose";

interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    participants: [ //here gave the array becuase one chat can have multiple participants
      {
        type: Schema.Types.ObjectId,
        ref: "User", // this is will get the reference from the user collection
        required: true,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const Chat = mongoose.model<IChat>("Chat", ChatSchema);

export default Chat;
