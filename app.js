/* eslint-disable */
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
app.use(bodyParser.json());

//authentication purpose

const { Op } = require("sequelize");

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

const { Course, Chapter, Page, User, Enroll, Complete } = require("./models");

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
      // response.json({ courses });
      response.render("index", { courses, users, user: request.user });
    } else {
      response.json({ courses });
    }
  },
);

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
        description: request.body.description,
      });
      return response.redirect(`/courses/${request.params.id}/chapters`);
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
      const course = await Course.findByPk(request.params.id);
      const enrolled =
        (await Enroll.findOne({
          where: {
            userId: request.user.id,
            courseId: request.params.id,
          },
        })) != null;
      let count = 0;
      let totalCount = 0;
      for (const i in chapters) {
        const pages = await Page.findAll({
          where: {
            chapterId: chapters[i].dataValues.id,
          },
        });
        totalCount += pages.length;
        for (const j in pages) {
          count += await Complete.count({
            where: {
              pageId: pages[i].dataValues.id,
              userId: request.user.id,
            },
          });
        }
      }
      return response.render("chapters", {
        chapters,
        id: request.params.id,
        user: request.user,
        course,
        enrolled: enrolled,
        count,
        totalCount,
      });
    } catch (err) {
      console.log(err);
    }
  },
);

app.get(
  "/courses/:id/addChapter",
  connectEnsureLogin.ensureLoggedIn(),
  (request, response) => {
    response.render("addChapter", {
      id: request.params.id,
      user: request.user,
    });
  },
);

app.post(
  "/courses/:coId/chapters/:chid/pages",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const page = await Page.addPage({
        content: request.body.content,
        chapterId: request.params.chid,
        title: request.body.title,
      });
      return response.redirect(
        `/courses/${request.params.coId}/chapters/${request.params.chid}/pages`,
      );
    } catch (err) {
      console.log(err);
      return response.status(422).json(err);
    }
  },
);

app.get("/courses/:coId/chapters/:chId/pages/:id", (request, response) => {
  response.redirect(`/courses/chapters/pages/${request.params.id}`);
});

app.get(
  "/courses/chapters/pages/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const page = await Page.findByPk(request.params.id);
    const completed =
      (await Complete.findOne({
        where: {
          userId: request.user.id,
          pageId: request.params.id,
        },
      })) != null;
    response.render("page", { page, user: request.user, completed });
  },
);

app.get(
  "/courses/:coId/chapters/:id/pages",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const pages = await Page.getPages(request.params.id);
      const chapter = await Chapter.findByPk(request.params.id);
      const course = await Course.findByPk(chapter.dataValues.courseId);
      response.render("pages", { pages, user: request.user, chapter, course });
    } catch (err) {
      console.log(err);
    }
  },
);

app.get(
  "/courses/:coId/chapters/:id/addPage",
  connectEnsureLogin.ensureLoggedIn(),
  (request, response) => {
    response.render("addPage", { id: request.params.id, user: request.user });
  },
);

app.put(
  "/courses/:id/markAsComplete",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (
      await Complete.findOne({
        where: {
          userId: request.user.id,
          pageId: request.params.id,
        },
      })
    ) {
      response.redirect(`/courses/chapters/${request.params.id}/pages`);
    } else {
      try {
        const page = await Page.findByPk(request.params.id);
        await page.markAsCompleted({ completed: true });
        await Complete.create({
          userId: request.user.id,
          pageId: request.params.id,
        });
        resposne.render("page", { page, user: request.user });
      } catch (err) {
        console.log(err);
      }
    }
  },
);

app.get(
  "/mycourses",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const courses = await Course.findAll({
      where: {
        userId: request.user.id,
      },
    });
    const enrolled = [];
    for (var i in courses) {
      let count = await Enroll.count({
        where: {
          courseId: courses[i].dataValues.id,
        },
      });
      enrolled.push(count);
    }
    response.render("coursesMine", { courses, user: request.user, enrolled });
  },
);

app.get(
  "/reports",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const courses = await Course.findAll({
        where: {
          userId: request.user.id,
        },
      });
      const reports = [];
      for (const i in courses) {
        const users = await Enroll.findAll({
          where: {
            courseId: courses[i].dataValues.id,
          },
        });

        for (const j in users) {
          const course = await Course.findByPk(courses[i].dataValues.id);
          const oneUser = await User.findByPk(users[j].dataValues.userId);
          let report = {
            firstName: oneUser.dataValues.firstName,
            lastName: oneUser.dataValues.lastName,
            email: oneUser.dataValues.email,
            enrollDate: oneUser.dataValues.createdAt
              .toString()
              .substring(0, 24),
            course: course.dataValues.title,
          };
          reports.push(report);
        }
      }
      response.render("reports", { reports, user: request.user });
    } catch (err) {
      console.log(err);
    }
  },
);

app.get("/delete/:id", async (request, response) => {
  response.redirect("/mycourses");
});

app.get(
  "/addCourse",
  connectEnsureLogin.ensureLoggedIn(),
  (request, response) => {
    response.render("addCourse", { user: request.user });
  },
);

app.get(
  "/myEnrolledCourses/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const mycourses = await Enroll.findAll({
        where: {
          userId: request.user.id,
        },
        attributes: ["courseId"],
      });
      const mycoursesArray = [];
      for (const mycourse in mycourses) {
        mycoursesArray.push(mycourses[mycourse].dataValues.courseId);
      }
      const courses = await Course.findAll({
        where: {
          id: {
            [Op.in]: mycoursesArray,
          },
        },
      });
      response.render("myCourses", { courses, user: request.user });
    } catch (err) {
      console.log(err);
    }
  },
);

app.get("/myEnrolledCourses/courses/:id/chapters", (request, response) => {
  response.redirect(`/courses/${request.params.id}/chapters`);
});

app.get(
  "/enroll/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (
      await Enroll.findOne({
        where: {
          userId: request.user.id,
          courseId: request.params.id,
        },
      })
    ) {
      response.redirect(`/myEnrolledCourses/${request.user.id}`);
    } else {
      try {
        const enroll = await Enroll.create({
          userId: request.user.id,
          courseId: request.params.id,
        });
        response.redirect(`/myEnrolledCourses/${request.user.id}`);
      } catch (err) {
        console.log(err);
      }
    }
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
