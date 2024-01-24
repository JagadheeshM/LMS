/* eslint-disable */
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const { Course } = require("./models");

app.get("/", (resquest, response) => {
  response.send("Hello World..!");
});

app.get("/courses", (request, response) => {
  console.log("List of courses");
  response.send("List of courses");
});

app.post("/courses", async (request, response) => {
  console.log(request.body);
  try {
    const course = await Course.addCourse({ title: request.body.title });
    return response.json(course);
  } catch (err) {
    console.log(err);
    return response.status(422).json(err);
  }
});

app.put("/courses/:id/markAsComplete", (request, resposne) => {
  console.log(`course ${request.params.id} marked as complete`);
  response.send(`course ${request.params.id} marked as complete`);
});

app.listen(3000, () => {
  console.log("Server started at port 3000");
});
