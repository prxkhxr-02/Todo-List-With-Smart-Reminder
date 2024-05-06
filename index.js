const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { User, Task } = require("./config");
const cron = require("node-cron");
const { exec } = require("child_process");
const { Console } = require("console");
const http = require('http');
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: "123456789", // Change this to a random secret key
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  const data = {
    name: req.body.username,
    password: req.body.password,
  };

  try {
    const existingUser = await User.findOne({ name: data.name });
    if (existingUser) {
      return res.send("User already exists. Please choose another username.");
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    await User.create({ name: data.name, password: hashedPassword });
    res.render("login");
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send("Error creating user. Please try again later.");
  }
});

app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ name: req.body.username });
    if (!user) {
      return res.send("User not found");
    }

    const isPasswordMatch = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (isPasswordMatch) {
      req.session.user = user;
      return res.redirect("/home");
    } else {
      return res.send("Wrong password");
    }
  } catch (error) {
    console.error("Error during login:", error.message);
    return res.send("Error occurred during login: " + error.message);
  }
});

app.get("/home", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/");
    }

    const tasks = await Task.find({ userId: req.session.user._id });
    res.render("home", { tasks: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).send("Error fetching tasks. Please try again later.");
  }
});

app.post("/add-task", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/");
    }

    const newTask = new Task({
      userId: req.session.user._id,
      date: req.body.date,
      month: req.body.month,
      time: req.body.time,
      task_name: req.body.task_name,
      description: req.body.description,
    });

    await newTask.save();
    res.redirect("/home");
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).send("Error adding task. Please try again later.");
  }
});

app.get("/alerts", (req, res) => {
  fs.readFile('alerts.txt', 'utf8', (err, data) => {
      if (err) {
          console.error('Error reading alerts file:', err);
          res.status(500).send('Error reading alerts file');
      } else {
          res.send(data);
      }
  });
});

app.post("/alert", (req, res) => {
  const message = req.body.message;

  fs.writeFile('alerts.txt', `${message}\n`, (err) => {
      if (err) {
          console.error('Error writing to alerts file:', err);
          res.status(500).send('Error saving alert to file');
      } else {
          res.sendStatus(200); // Send success response
      }
  });
});

function sendAlertToWebInterface(alertMessage) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/alert',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const req = http.request(options, (res) => {
  });

  req.on('error', (error) => {
  });

  req.write(JSON.stringify({ message: alertMessage }));
  req.end();
}


cron.schedule("* * * * *", async () => {
  try {
    const currentTime = new Date();
    const tasks = await Task.find({ time: { $lte: currentTime } });
    for (const task of tasks) {
      const taskTime = new Date(currentTime.toDateString() + " " + task.time);
      const timeDiff = taskTime.getTime() - currentTime.getTime();

      const arguments = `${task.description}`;
      exec(
        `python python_module\\predict_urgency.py ${arguments}`,
        (error, stdout, stderr) => {
          if (error) {
            console.error("Error executing Python script:", error);
            return;
          }

          stdout = stdout.trim();
          if (stdout === "urgent") {
            if (timeDiff <= 10 * 60 * 1000 && timeDiff >= 0) {
              const minutesDiff = Math.floor(timeDiff / (1000 * 60)) + 1;
              sendAlertToWebInterface(`Reminder for task: ${task.task_name} is due in "${minutesDiff}" minutes.`);
            }
            else {
              sendAlertToWebInterface(`Reminder for task: ${task.task_name}`);
            }
          } else {
            if (
              taskTime.getHours() === currentTime.getHours() &&
              taskTime.getMinutes() === currentTime.getMinutes()
            ) {
              sendAlertToWebInterface(`Reminder for task: ${task.task_name}`);
            }
          }
        }
      );
    }
  } catch (error) {
    console.error("Error scheduling reminders:", error);
  }
});

app.post("/delete-task", async (req, res) => {
  try {
    const taskId = req.body.taskId;
    await Task.findByIdAndDelete(taskId);
    res.redirect("/home");
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).send("Error deleting task. Please try again later.");
  }
});

app.post("/logout", (req, res) => {
  if (req.session.user) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        res.status(500).send("Error logging out. Please try again later.");
      } else {
        res.redirect("/");
      }
    });
  } else {
    res.redirect("/");
  }
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});