const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000

// middleware

app.use(cors())
app.use(express.json())
// app.use(cookieParser())






const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
}



const uri = 
`mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-upko9jz-shard-00-00.ckoz8fu.mongodb.net:27017,ac-upko9jz-shard-00-01.ckoz8fu.mongodb.net:27017,ac-upko9jz-shard-00-02.ckoz8fu.mongodb.net:27017/?ssl=true&replicaSet=atlas-rkrx6l-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0`;

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ckoz8fu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function run() {
  try {
 

    
    const usersCollection = client.db('SurveyApp').collection('users')
    const surveysFormCollection = client.db('SurveyApp').collection('surveysForm')
    const paymentCollection = client.db('SurveyApp').collection('payment')
    const serveyVotingCollection = client.db('SurveyApp').collection('serveyVoting')



    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })

      // middlewares 
      const verifyToken = (req, res, next) => {
        console.log('inside verify token', req.headers.authorization);
        if (!req.headers.authorization) {
          return res.status(401).send({ message: 'unauthorized access' });
        }
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
          if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
          }
          req.decoded = decoded;
          next();
        })
      }
  
    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }
    // surveys form
    app.post('/surveysForm', async (req, res) => {
      const item = req.body;
      // console.log(item);
      const result = await surveysFormCollection.insertOne(item);
      res.send(result);
    });
     // users related api
     app.get('/users',verifyToken, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });



    // save a user data in db
    app.put('/user', async (req, res) => {
      const user = req.body
      // console.log(user);
      const query = { email: user?.email }
      // check if user already exists in db
      const isExist = await usersCollection.findOne(query)
      if (isExist) {
        if (user.status === 'Requested') {
          // if existing user try to change his role
          const result = await usersCollection.updateOne(query, {
            $set: { 
              
              status: user?.status,
              name: user?.name,

             },
          })
          return res.send(result)
        } else {
          // if existing user login again
          return res.send(isExist)
        }
      }

      // save user for the first time
      const options = { upsert: true }
      const updateDoc = {
        $set: {
          ...user,
          timestamp: Date.now(),
        },
      }
      const result = await usersCollection.updateOne(query, updateDoc, options)
      res.send(result)
    })

     // get a user info by email from db
     app.get('/user/:email', async (req, res) => {
      const email = req.params.email
      const result = await usersCollection.findOne({ email })
      res.send(result)
    })




    // users related api testig purpse------
    app.get('/surveyor', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };

      const result = await surveysFormCollection.find(query).toArray();
      res.send(result);
    });

    // surveyor single Id display
    app.get('/surveyor/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await surveysFormCollection.findOne(query);
      res.send(result);
    })
    //  surveyor Update Id display
    app.patch('/surveyor/:id', async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
            Description: item.Description,
            Title: item.Title,
            deadline: item.deadline,
            createDate: item.createDate,
            category: item.category,
            status: 1,
            email:item.email,
            image: item.image
        }
      }
      const result = await surveysFormCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })
    

    // All surveyor data get
     app.get('/all/surveyor', async (req, res) => {
      const result = await surveysFormCollection.find().toArray();
      res.send(result);
    });

   



    // role change pro-user
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'pro-user'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })


   




    app.post('/user', async (req, res) => {
      const user = req.body;
      console.log(user)
      // insert email if user doesnt exists: 
      // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });



    // payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
     // console.log(amount, 'amount inside the intent')

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    });


    app.post('/payments', async (req, res) => {
      const payment = req.body;
      
      const paymentResult = await paymentCollection.insertOne(payment);
      const email= payment.email;
      const query = { email: payment.email };
      console.log("checke----payment email",query);
      // const result = await usersCollection.find(query);
      // console.log("user-------",result)
      //  res.send(result)

        // console.log(result);
        const result = await usersCollection.findOne(query);

        

        const filter = await usersCollection.findOne(result._id);
        const updatedDoc = {
          $set: {
            role: 'pro-user'
          }
        }
        const role = await usersCollection.updateOne(filter, updatedDoc);
        // res.send(result);

       res.send({paymentResult,role});
    })




    //surveys form letest 6
    app.get('/letest/surveyor', async (req, res) => {
      const result = await surveysFormCollection.find().sort({ createDate: -1 }).limit(6).toArray();
      res.send(result);
      console.log(result);
    });




    // servey Voting form
    app.post('/serveyVoting', async (req, res) => {
        const item = req.body;
        // console.log(item);
        const result = await serveyVotingCollection.insertOne(item);
        res.send(result);
    });

// Vote Collection----
    app.get('/vote/collection', async (req, res) => {
      try {
         
          const topSex = [
              { $group: { _id: "$SurveyID", vote: { $sum: 1 } } },
              { $sort: { vote: -1 } },
              { $limit: 6 }
          ];
  
          const topSellingFoodItems = await serveyVotingCollection.aggregate(topSex).toArray();
          res.json(topSellingFoodItems);
      } catch (error) {
          console.error('Error:', error);
          res.status(500).send('Internal Server Error');
      }
  });



  //  // get a user info by email from db




  
  app.get('/vote/collect/:id', async (req, res) => {
   

    try {
        
       const SurveyID = req.params.id
       const query = { SurveyID: SurveyID,vote:1 }
       const yes = await serveyVotingCollection.find(query).toArray();
      //  const queryNo = { SurveyID: SurveyID,vote:0 }
      //  const no = await serveyVotingCollection.find(queryNo).toArray();
      
      
      res.send(yes);
       
  
      } catch (error) {

          console.error('Error:', error);
          res.status(500).send('Internal Server Error');
      }

})








    // Send a ping to confirm a successful connection







    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from SurveyApp Server Server..')
})

app.listen(port, () => {
  console.log(`SurveyApp Server is running on port ${port}`)
})
