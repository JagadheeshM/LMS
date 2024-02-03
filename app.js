/* eslint-disable */
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
app.use(bodyParser.json());

//set EJS as view engine

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const { Course, Chapter, Page, User } = require("./models");

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
    return response.redirect(`/courses/${course.id}/chapters`);
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
    return response.redirect(`/courses/chapters/${chapter.id}/pages`);
  } catch (err) {
    console.log(err);
    return response.status(422).json(err);
  }
});

app.get("/courses/:id/chapters", async (request, response) => {
  try {
    const chapters = await Chapter.getChapters(request.params.id);
    return response.render("chapters", { chapters, id: request.params.id });
  } catch (err) {
    console.log(err);
  }
});

app.get("/courses/:id/addCourse", (request, response) => {
  response.render("addChapter", { id: request.params.id });
});

app.post("/courses/chapters/:chid/pages", async (request, response) => {
  try {
    const page = await Page.addPage({
      content: request.body.content,
      chapterId: request.params.chid,
    });
    return response.redirect(`/courses/chapters/pages/${page.id}`);
  } catch (err) {
    console.log(err);
    return response.status(422).json(err);
  }
});

app.get("/courses/chapters/pages/:id", async (request, response) => {
  const page = await Page.findByPk(request.params.id);
  response.render("page", { page });
});

app.get("/courses/chapters/:id/pages", async (request, response) => {
  try {
    const pages = await Page.getPages(request.params.id);
    response.render("pages", { pages });
  } catch (err) {
    console.log(err);
  }
});

app.get("/courses/chapters/:id/addPage", (request, response) => {
  response.render("addPage", { id: request.params.id });
});

app.put("/courses/:id/markAsComplete", async (request, resposne) => {
  try {
    const page = await Page.findByPk(request.params.id);
    await page.markAsCompleted({ completed: true });
    resposne.render("page", { page });
  } catch (err) {
    console.log(err);
  }
});

app.get("/addCourse", (request, response) => {
  response.render("addCourse");
});

app.get("/signup", (request, response) => {
  response.render("signup");
});

app.get("/login", (request, response) => {
  response.render("login");
});

app.post("/users", async (request, response) => {
  const user = await User.create({
    firstName: request.body.firstName,
    lastName: request.body.lastName,
    email: request.body.email,
    password: request.body.password,
    type: request.body.type,
  });
  response.json(user);
});

module.exports = app;
