import express from "express";
import { News } from "../models/model.mjs";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const news = await News.find().sort({ updatedAt: -1 });
    res.render("index.ejs", { news });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data");
  }
});

router.get("/date/:date", async (req, res) => {
  try {
    const date = req.params.date;
    const news = await News.find({
      date: { $gte: `${date}T00:00:00`, $lt: `${date}T23:59:59` }}).sort({ date: -1 });
    res.render("index.ejs", { news });
  } catch (error){
    console.error("Error fetching news:", error);
    next(error);
  }
});

export default router;
