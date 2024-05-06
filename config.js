const mongoose = require("mongoose");

const connect = mongoose.connect("mongodb://127.0.0.1:27017/todo");

connect.then(() => {
    console.log("Database connected successfully");
})
.catch((err) => {
    console.error("Database connection error:", err);
});

const loginSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
});

const taskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    month: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    task_name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
});

const Task = mongoose.model("Task", taskSchema);

const User = mongoose.model("User", loginSchema);

module.exports = {User, Task};