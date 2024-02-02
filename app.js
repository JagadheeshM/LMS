/* eslint-disable */
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
app.use(bodyParser.json());

//set EJS as view engine

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

const { Course, Chapter, Page } = require("./models");

app.get("/", async (resquest, response) => {
  const courses = await Course.getCourses();
  if (resquest.accepts("html")) {
    response.render("index", { courses });
  } else {
    response.json({ courses });
  }
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

app.post("/courses/:id/chapters", async (request, response) => {
  console.log(request.body);
  try {
    const chapter = await Chapter.addChapter({
      title: request.body.title,
      courseId: request.params.id,
    });
    return response.json(chapter);
  } catch (err) {
    console.log(err);
    return response.status(422).json(err);
  }
});

app.get("/courses/:id/chapters", async (request, response) => {
  try {
    const chapters = await Chapter.getChapters(request.params.id);
    response.json(chapters);
  } catch (err) {
    console.log(err);
  }
});

app.post("/courses/:id/chapters/:chid/pages", async (request, response) => {
  console.log(request.body);
  try {
    const page = await Page.addPage({
      content: request.body.content,
      chapterId: request.params.chid,
    });
    return response.json(page);
  } catch (err) {
    console.log(err);
    return response.status(422).json(err);
  }
});

app.get("/courses/chapters/:id/pages", async (request, response) => {
  try {
    const pages = await Page.getPages(request.params.id);
    response.json(pages);
  } catch (err) {
    console.log(err);
  }
});

app.put("/courses/:id/markAsComplete", (request, resposne) => {
  console.log(`course ${request.params.id} marked as complete`);
  response.send(`course ${request.params.id} marked as complete`);
});

module.exports = app;
