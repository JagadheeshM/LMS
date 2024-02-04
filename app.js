/* eslint-disable */
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
app.use(bodyParser.json());

//authentication purpose

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");

const bcrypt = require("bcrypt");
const saltRounds = 10;

app.use(
  session({
    secret: "my-super-secret-key-16060420102002061004",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const passRes = await bcrypt.compare(password, user.password);
          if (passRes) {
            return done(null, user);
          } else {
            return done("Invalid password");
          }
        })
        .catch((error) => {
          return error;
        });
    },
  ),
);

passport.serializeUser((user, done) => {
  console.log("serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

//set EJS as view engine

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const { Course, Chapter, Page, User } = require("./models");

app.get(
  "/",
  //connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const courses = await Course.getCourses();
    const users = [];
    for (const course of courses) {
      let user = (
        await User.findOne({
          where: {
            id: course.userId,
          },
          attributes: ["firstName"],
        })
      ).firstName;
      users.push(user);
    }
    if (request.accepts("html")) {
      console.log(courses);
      // response.json({ courses });
      response.render("index", { courses, users, user: request.user });
    } else {
      response.json({ courses });
    }
  },
);

app.get("/courses", (request, response) => {
  console.log("List of courses");
  response.send("List of courses");
});

app.post(
  "/courses",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const course = await Course.addCourse({
        title: request.body.title,
        userId: request.user.id,
      });
      return response.redirect(`/courses/${course.id}/chapters`);
    } catch (err) {
      console.log(err);
      return response.status(422).json(err);
    }
  },
);

app.post(
  "/courses/:id/chapters",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
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
  },
);

app.get(
  "/courses/:id/chapters",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const chapters = await Chapter.getChapters(request.params.id);
      return response.render("chapters", { chapters, id: request.params.id });
    } catch (err) {
      console.log(err);
    }
  },
);

app.get(
  "/courses/:id/addCourse",
  connectEnsureLogin.ensureLoggedIn(),
  (request, response) => {
    response.render("addChapter", { id: request.params.id });
  },
);

app.post(
  "/courses/chapters/:chid/pages",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
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
  },
);

app.get(
  "/courses/chapters/pages/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const page = await Page.findByPk(request.params.id);
    response.render("page", { page });
  },
);

app.get(
  "/courses/chapters/:id/pages",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const pages = await Page.getPages(request.params.id);
      response.render("pages", { pages });
    } catch (err) {
      console.log(err);
    }
  },
);

app.get(
  "/courses/chapters/:id/addPage",
  connectEnsureLogin.ensureLoggedIn(),
  (request, response) => {
    response.render("addPage", { id: request.params.id });
  },
);

app.put(
  "/courses/:id/markAsComplete",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, resposne) => {
    try {
      const page = await Page.findByPk(request.params.id);
      await page.markAsCompleted({ completed: true });
      resposne.render("page", { page });
    } catch (err) {
      console.log(err);
    }
  },
);

app.get(
  "/addCourse",
  connectEnsureLogin.ensureLoggedIn(),
  (request, response) => {
    response.render("addCourse");
  },
);

app.get("/signup", (request, response) => {
  response.render("signup");
});

app.get("/login", (request, response) => {
  response.render("login");
});

app.post(
  "/session",
  passport.authenticate("local", { failureRedirect: "/login" }),
  (request, response) => {
    response.redirect("/");
  },
);

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.post("/users", async (request, response) => {
  //Hash the password
  const hashedPass = await bcrypt.hash(request.body.password, saltRounds);

  const user = await User.create({
    firstName: request.body.firstName,
    lastName: request.body.lastName,
    email: request.body.email,
    password: hashedPass,
    type: request.body.type,
  });
  request.login(user, (err) => {
    if (err) {
      console.log(err);
    }
    response.redirect("/");
  });
});

module.exports = app;
