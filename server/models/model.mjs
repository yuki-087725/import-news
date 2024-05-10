import mongoose  from "../helpers/db.mjs";


const newsSchema = mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    link:{
        type:String,
        required:true
    }
}, { timestamps:true });

const News = mongoose.model("News" , newsSchema);

export { News };