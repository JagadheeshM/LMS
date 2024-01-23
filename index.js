const express = require("express")
const app = express()

app.get("/", (resquest, response) => {
    response.send("Hello World..!")
})

app.listen(3000, () => {
    console.log("Server started at port 3000")
})