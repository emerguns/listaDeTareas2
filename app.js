const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const uri = require ("./atlas_uri")
const bodyParser = require("body-parser");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const client = new MongoClient(uri)
const dbName = "todolistv3";
const collectionName = "Item";
 
const Item = client.db(dbName).collection(collectionName)

const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log(`Connected successfully to server version ${dbName} database`);
  } catch (err) {
    console.error(`Error connecting to database: ${err}`);
  }
};

connectToDatabase();

const item1 = {
  name: "Bienvenid@ a Tu Lista De Tareas!"
};

const item2 = {
  name: "Click + boton para añadir una tarea."
};

const item3 = {
  name: "<-- Click para borrar una tarea."
};

const defaultItems = [item1, item2, item3];

app.get("/", async function (req, res) {
  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const foundItems = await collection.find().toArray();

    if (foundItems.length === 0) {
      await collection.insertMany(defaultItems);
      console.log("Successfully saved default items to DB.");
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Hoy", newListItems: foundItems });
    }
  } catch (err) {
    console.error(err);
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const db = client.db(dbName);
    const listCollection = db.collection("List");

    const foundList = await listCollection.findOne({ name: customListName });

    if (!foundList) {
      // Create a new list
      const list = {
        name: customListName,
        items: defaultItems
      };
      await listCollection.insertOne(list);
      res.redirect("/" + customListName);
    } else {
      // Show an existing list
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (err) {
    console.error(err);
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = {
    name: itemName
  };

  try {
    const db = client.db(dbName);
    const collection = db.collection(listName === "Hoy" ? collectionName : "List");

    if (listName === "Hoy") {
      await collection.insertOne(item);
      res.redirect("/");
    } else {
      await collection.updateOne({ name: listName }, { $push: { items: item } });
      res.redirect("/" + listName);
    }
  } catch (err) {
    console.error(err);
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  try {
    const db = client.db(dbName);
    const collection = db.collection(listName === "Hoy" ? collectionName : "List");

    if (listName === "Hoy") {
      await collection.deleteOne({ _id: ObjectId(checkedItemId) });
      console.log("Successfully deleted checked item.");
      res.redirect("/");
    } else {
      await collection.updateOne({ name: listName }, { $pull: { items: { _id: ObjectId(checkedItemId) } } });
      res.redirect("/" + listName);
    }
  } catch (err) {
    console.error(err);
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});
