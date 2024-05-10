import express from "express";
import env from "dotenv";
import mongoose from "./helpers/db.mjs";
import apiRoutes from "./api-routes/news.mjs";
import "../scraping.mjs";
env.config();



const app = express();
const port = process.env.PORT || 8080;


app.use(express.static('public'));

app.set('view engine', 'ejs');
//API 
app.use(apiRoutes);

app.listen(port, ()=>{
    console.log(`Server Start: http://localhost:${port}`);
});
