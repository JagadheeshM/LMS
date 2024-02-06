/* eslint-disable */
const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const { Complete, Enroll } = require("../models");
const app = require("../app");

let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("First test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("Signup", async () => {
    const res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/users").send({
      firstName: "abc",
      lastName: "xyz",
      email: "abc@gmail.com",
      password: "1234",
      type: "educator",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("add course", async () => {
    let res = await agent.get("/addCourse");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/courses").send({
      title: "Java",
      userId: 1,
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("add chapter", async () => {
    let res = await agent.get("/courses/1/addChapter");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/courses/1/chapters").send({
      title: "Introdunction of Java",
      courseId: 1,
      description: "Basics to Java",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("add page", async () => {
    let res = await agent.get("/courses/1/chapters/1/addPage");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/courses/1/chapters/1/pages").send({
      title: "How to install java",
      chapterId: 1,
      content: "Just go to official website and download",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Signout", async () => {
    let res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
  });

  test("Enroll in a course", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    await agent.post("/users").send({
      firstName: "user",
      lastName: "b",
      email: "buser@gmail.com",
      password: "1234",
      type: "learner",
      _csrf: csrfToken,
    });
    res = await agent.get("/enroll/1");
    res = (await Enroll.findOne({ where: { userId: 2 } })) != null;
    expect(res).toBe(true);
  });

  test("Mark as complete", async () => {
    let res = await agent.get("/courses/chapters/pages/1");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/courses/1/markAsComplete").send({
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
});
