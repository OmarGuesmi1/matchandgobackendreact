const express = require("express");
const dotenv = require("dotenv").config();
const dbConnect = require("./config/dbConnect");


const app = express();

dbConnect();
//middleware
app.use(express.json())

//routes

//start the server
const PORT = process.env.PORT || 7002;
app.listen(PORT, ()=>{
    console.log(`Server is running at port ${PORT}`);
});