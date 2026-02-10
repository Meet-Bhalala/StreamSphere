import dotenv from 'dotenv'
import mongoose from "mongoose";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})



connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`0  server is running at port : ${process.env.PORT || 8000}`)
    })
})
.catch((err) => {
    console.log("Mongo db connection failed !!! ",err);
}
)

