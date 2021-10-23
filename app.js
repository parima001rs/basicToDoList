const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extented: true}));
app.use(express.static("public"));

//for could not find "ico" module error
app.all('/:action', function(req, res){});

main().catch(err=> console.log(err));
async function main(){
    await mongoose.connect("mongodb+srv://admin-parima:Test123@cluster0.apou1.mongodb.net/todolistDB");
}

const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

//CHECK FOR ERROR MONGOOSE.SCHEMA MISSING
const listSchema = {
    name: String,
    items: [itemsSchema] // array of item document associated with it
};

const List = mongoose.model("List", listSchema);



app.get("/", function(req, res){


    Item.find( {}, function(err, foundItems){

        if(foundItems.length === 0){
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Successfully inserted items.");
                }
            });
            res.redirect("/");
        }
        else{
            res.render("list",{listTitle: "Today", newListItems: foundItems});
        }
        
    });
    
});

app.post("/",function(req, res){

    const itemName = req.body.newItem;
    const listName = req.body.list;
    
    //document
    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }

});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    Item.findByIdAndDelete(checkedItemId, function(err){
        if(!err){
            if(listName == "Today"){
                console.log("Successfully deleted the checked item.");
                res.redirect("/");
            }
            else{
                List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
                    if(!err){
                        res.redirect("/" + listName);
                    }
                });
            }
        }
    });
});

app.get("/:customList", function(req, res){
    const customListName = _.capitalize(req.params.customList);

    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                //create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
            
                list.save();
                res.render("/" + customListName);
            }
            else{
                //show an existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    });

    

});

app.get("/about", function(req, res){
    res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 4000;
}


app.listen(port, function(){
    console.log("Server has started successfully.");
});

//Heroku app link : https://still-brushlands-68461.herokuapp.com/