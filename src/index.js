import dotenv from 'dotenv'
import mongoose from "mongoose";
import connectDB from "./db/index.js";
import {app} from "./app.js"

dotenv.config({
    path: './.env'
})



connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`👍  server is running at port : ${process.env.PORT || 8000}`)
    })
})
.catch((err) => {
    console.log("Mongo db connection failed !!! ",err);
}
)

