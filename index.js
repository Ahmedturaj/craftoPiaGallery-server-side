const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000
// middleware
app.use(cors({
    origin: ['https://craftopia-gallery-client-side.web.app', 'http://localhost:5173'],
    credentials: true,
})
)
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nzlapl6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middleware
const logger = (req, res, next) => {
    console.log('logged info :', req.method, req.url);
    next();
}



const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;
    console.log(token);
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_USER_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access-2' })
        }
        req.user = decoded;
        next();
    })
}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        const infoCollections = client.db("craftopia").collection("craftopia");
        const userCollections = client.db("subscribeUser").collection("subscribeUser");
        const categoryCollections = client.db("cardCategories").collection("cardCategories");

        // jwt
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body
            console.log('user for token ', req.body);
            const token = jwt.sign(user, process.env.ACCESS_USER_TOKEN, { expiresIn: '1y' });
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            })
                .send({ success: true });
        })

        // logOut
        app.post('/logOut', async (req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })
        // get
        app.get('/arts', async (req, res) => {
            const cursor = infoCollections.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/arts/:id', logger, async (req, res) => {

            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await infoCollections.findOne(query);
            res.send(result);
        })
        //    get data by email
        app.get('/myArt/:email', logger, verifyToken, async (req, res) => {
            if (req.params.email !== req.user.email) {
                return res.status(403).send({ message: 'Forbidden access' })
            }
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

        app.put('/arts/:id', logger, async (req, res) => {

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


        // cardCategories
        app.get('/categories', async (req, res) => {
            const cursor = categoryCollections.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        // cardCategories subcategory_name
        app.get('/categories/:subcategory_name', logger, async (req, res) => {

            const category = req.params.subcategory_name;
            const query = { subcategory_name: category };
            const cursor = categoryCollections.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });
        // 

        app.get('/category/:id', logger, async (req, res) => {

            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await categoryCollections.findOne(query);
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