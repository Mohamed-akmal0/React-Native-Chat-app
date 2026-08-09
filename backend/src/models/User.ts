// we don't need to explicitly add the type but it is a best practice
// also good for the performance, it will avoid tree shaking method
import mongoose, {Schema, type Document} from "mongoose";

export interface IUser extends Document {
    clerkId: string; // this is for authentication with clerk
    name: string;
    email: string;
    password: string;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    clerkId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    avatar: {
        type: String,
        required: false,
        default: "",
    },
}, {
    // this will add createdAt and updatedAt fields to the schema
    timestamps: true,
});

export const User = mongoose.model<IUser>("User", UserSchema);

export default User;