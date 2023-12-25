import express from "express";
import ejs from "ejs";
import mongoose from "mongoose";
import moment from "moment";
import dotenv from 'dotenv';

import { List } from "./models/List.js";
import { Item } from "./models/Item.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/todolistDB';

app.engine(".html", ejs.__express);
app.set("view engine", "html");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(DATABASE_URL);


app.route("/")
    .get(async (req, res) => {
        let isToday
        const lists = await List.find({}).sort({dateby: -1}).limit(1)

        if (lists.length > 0) {
            const dateList = moment(lists[0].dateby).format('YYYY-MM-DD');
            const today = moment().format('YYYY-MM-DD');
            isToday = dateList == today
        }
        // console.log(lists[0].items)
        try {
            // database exists item's today
            if (isToday) {
                const list =  await lists[0].populate('items');
                res.render("list", { listTitle: 'Today', items: list.items, lists });
            // database not exists item's today
            } else {
                res.render("list", { listTitle: 'Today', items: [], lists });
            }
        } catch (error) {
            console.log(error);
        }
    })
    .post(async (req, res) => {
        let isToday
        const today = moment().format('YYYY-MM-DD');
        try {
            const lists = await List.find({}).sort({dateby: -1}).limit(1)

            if (lists.length > 0) {
                const dateList = moment(lists[0].dateby).format('YYYY-MM-DD');
                isToday = dateList == today
            }

            const newItem = new Item(req.body);
            await newItem.save();

            if (!isToday) {
                const newList = new List({
                    name: today,
                    items: newItem._id,
                    dateby: new Date()
                })
                await newList.save();
            } else {
                await lists[0].items.push(newItem._id);
                await lists[0].save();
            }
        } catch (error) {
            console.log(error);
        } finally {
            res.redirect("/");
        }
        
    });

app.route("/:customListName")
    .get(async (req, res) => {
        let customListName = req.params.customListName;
        if (customListName == 'Today') {
            res.redirect("/");
        }
        const checkList = await List.findOne({name: customListName});
        if (checkList) {
            const checkItems = await checkList.populate('items');
            res.render("list", { listTitle: checkItems.name, items: checkItems.items });
        } else {
            // create a new list item
            try {
                if (!['favicon.ico', 'robot.txt'].includes(customListName)) {
                    const newList = new List({
                        name: customListName,
                        dateby: new Date()
                    })
                    console.log(customListName)
                    
                    await newList.save();
                    customListName = newList.name;
    
                }
                res.redirect(`/${customListName}`);
            } catch (error) {
                console.log(error);            
            }
        }
    })
    // add item into customList
    .post(async (req, res) => {
        const customListName = req.params.customListName;
        if (customListName == 'Today') {
            res.redirect("/");
        }
        try {
            const newItem = new Item(req.body);
            await newItem.save();
            const addList = await List.findOne({name: customListName});
            await addList.items.push(newItem._id);
            addList.save();
            res.redirect("/"+customListName);
        } catch (error) {
            console.log(error);
        }
        
    });

// route check item
app.route("/:itemid/check")
    .post(async (req, res) => {
        const checkedItemId = req.params.itemid;
        const customListName = req.body.title
        try {
            const checkItem = await Item.findById(checkedItemId)
            await Item.updateOne({_id: checkedItemId},{checked: !checkItem.checked})
            if (customListName == "Today") {
                res.redirect('/')
            } else {
                res.redirect('/'+customListName)
            }
        } catch (error) {
            console.log(error)            
        }
    });

app.route("/:itemid/delete")
    .post(async (req, res, next) => {
        const deleteItemid = req.params.itemid
        const customListName = req.body.title
        let searchListName = customListName
        if (customListName == "Today") {
            searchListName =  moment().format('YYYY-MM-DD')
        }
        try {
            await List.findOneAndUpdate(
                {name: searchListName},
                { $pull: { items: deleteItemid } },
                { new: true }
            );
            const deleteItem = await Item.findByIdAndDelete(deleteItemid)
        } catch (error) {
            console.log(error);                
        }
        
        if (customListName == "Today") {
            res.redirect('/')
        } else {
            res.redirect('/'+customListName)
        }
        
    })

app.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
});
