const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000
// middleware
app.use(cors());
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true,
})
)
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nzlapl6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        const infoCollections = client.db("craftopia").collection("craftopia");
        const userCollections = client.db("subscribeUser").collection("subscribeUser");
        const categoryCollections = client.db("cardCategories").collection("cardCategories");

        // get
        app.get('/arts', async (req, res) => {
            const cursor = infoCollections.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/arts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await infoCollections.findOne(query);
            res.send(result);
        })
        //    get data by email
        app.get('/myArt/:email', async (req, res) => {
            const userEmail = req.params.email;
            const query = { user_email: userEmail };
            const cursor = infoCollections.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });


        // post
        app.post('/arts', async (req, res) => {
            const info = req.body;
            const result = await infoCollections.insertOne(info)
            res.send(result)
        })

        // put

        app.put('/arts/:id', async (req, res) => {
            const id = req.params.id;
            const info = req.body;
            console.log(id, info);

            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updatedUser = {
                $set: {
                    image: info.image,
                    item_name: info.item_name,
                    subcategory_name: info.subcategory_name, short_description: info.short_description, price: info.price,
                    rating: info.rating,
                    customization: info.customization, processing_time: info.processing_time, stock_status: info.stock_status, user_email: info.user_email,
                    user_name: info.user_name
                }
            }

            const result = await infoCollections.updateOne(filter, updatedUser, options);
            res.send(result);

        })

        // delete
        app.delete('/arts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await infoCollections.deleteOne(query)
            res.send(result);
        })
        // user data 
        // post
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollections.insertOne(user)
            res.send(result)
        })

        // get

        app.get('/users', async (req, res) => {
            const cursor = userCollections.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        //    get User data by email
        app.get('/users/:email', async (req, res) => {
            const userEmail = req.params.email;
            const query = { email: userEmail };
            const cursor = userCollections.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        // cardCategories
        app.get('/categories', async (req, res) => {
            const cursor = categoryCollections.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('The art&Craft server is running...')
})

app.listen(port, () => {
    console.log(`the port number is ${port}`);
})