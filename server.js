const path = require('path');
const fs = require('fs');
const cors = require('cors');
const express = require('express');
const { ObjectId } = require('mongodb');
const MongoClient = require('mongodb').MongoClient;

const app = express();

app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
    console.log(req.url);
    next();
});

MongoClient.connect("mongodb+srv://Databaseuser:Kynbataon@cluster0.kvycak7.mongodb.net/", (err, client) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        const db = client.db('CW2');
        console.log("Database connected");

        // Create Lesson Model
        const Lesson = db.collection('lesson');

        // Fetch all lessons
        app.get('/lesson', (req, res) => {
            Lesson.find({}).toArray((err, lessons) => {
                if (err) {
                    res.status(500).send('Error retrieving lessons from the database');
                } else {
                    res.json(lessons);
                }
            });
        });

        app.param('collectionName', (req, res, next, collectionName) => {
            req.collection = db.collection(collectionName);
            return next();
        });

        app.get('/collection/:collectionName', (req, res, next) => {
            req.collection.find({}).toArray((e, results) => {
                if (e) return next(e);
                res.send(results);
            });
        });

        app.post('/collection/:collectionName', (req, res, next) => {
            req.collection.insert(req.body, (e, results) => {
                if (e) return next(e);
                let response = { "message": "success" };
                res.send(response);
            });
        });

        // Update an object
        // app.put('/collection/:collectionName/:id', (req, res, next) => {
        //     let id = new ObjectId(req.params.id);
        //     req.collection.updateOne({ _id: id }, { $set: req.body }, { safe: true, multi: false },
        //         (e, result) => {
        //             if (e) return next(e);
        //             res.send(result.modifiedCount === 1 ? { msg: 'success' } : { msg: 'error' });
        //         });
        // });



 app.put("/collection/:collectionName/:id", (req, res, next) => {
  try {
    const objectID = require("mongodb").ObjectID;

    req.connection.updateOne(
      { _id: new objectID(req.params.id) },
      { $inc: { space: -1 } }, // Decrementing space by 1
      (e, result) => {
        if (e) return next(e);
        res.send(
          result.modifiedCount === 1 ? { msg: "Success" } : { msg: "error" }
        );
      }
    );
  } catch (ex) {
    console.log("🚀 ~ app.put ~ ex:", ex);
    next(ex); // Pass error to the error handler
  }
});

        // Search
        app.get('/collection/:collectionName/search', (req, res, next) => {
            let query_str = req.query.key_word;
            req.collection.find({}).toArray((e, results) => {
                if (e) return next(e);
                let newList = results.filter((lesson) => {
                    return lesson.subject.toLowerCase().match(query_str) || lesson.location.toLowerCase().match(query_str);
                });
                res.send(newList);
            });
        });
        //Order
        // app.post('/collection/order', (req, res, next) => {
        //     req.collection.insert(req.body, (e, result) => {
        //         if (e) return next(e);
        //         let response = { "message": "success" };
        //         res.send(response);
        //     });
        // });
        app.post('/collection/orders', (req, res) => {
            const order = req.body; // Assuming the order data is sent in the request body

            // Get the reference to the orders collection in MongoDB
            const ordersCollection = client.db(cw2).collection('order');

            // Insert the order into MongoDB
            ordersCollection.insertOne(order, (err, result) => {
                if (err) {
                    console.error('Error inserting order:', err);
                    res.status(500).send('Error inserting order');
                    return;
                }

                res.json({ message: 'Order inserted successfully' });
            });
        });
        app.get('/collection/lesson/search', (req, res, next) => {
            let query_str = req.query.key_word;
            Lesson.find({
                $or: [
                    { subject: { $regex: query_str, $options: 'i' } },
                    { location: { $regex: query_str, $options: 'i' } }
                ]
            }).toArray((err, lessons) => {
                if (err) {
                    res.status(500).send('Error retrieving lessons from the database');
                } else {
                    res.json(lessons);
                }
            });
        });
        app.use(function(req, res, next) {
            var filePath = path.join(__dirname, "static", req.url);
            fs.stat(filePath, function(err, fileInfo) {
                if (err) {
                    next();
                    return;
                }
                if (fileInfo.isFile()) {
                    res.sendFile(filePath);
                } else {
                    next();
                }
            });
        });

        app.use(function(req, res) {
            res.status(404);
            res.send("File not found");
        });

        const port = process.env.PORT || 3000;

        app.listen(port, () => {
            console.log("App running on port", port);
        });
    }
});
