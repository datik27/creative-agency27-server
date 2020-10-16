const express=require('express')
const cors=require('cors')
const bodyParser=require('body-parser')
const app=express()
const fileUpload =require('express-fileupload')

app.use(fileUpload())
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
require('dotenv').config()
const admin = require('firebase-admin');


const { ObjectID } = require('mongodb')

const serviceAccount = require(`${__dirname}/private.json`);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://creative-agency-fullstack.firebaseio.com"
});



app.get('/',(req,res)=>{
    admin.auth().verifyIdToken(req.headers.token)
    .then(result=>{
        res.send(result)
    })
})



const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fjsvr.mongodb.net/${process.env.MY_DB}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const ordersCollection = client.db(`${process.env.MY_DB}`).collection("orders");
  const reviewsCollection = client.db(`${process.env.MY_DB}`).collection("reviews");
  const servicesCollection = client.db(`${process.env.MY_DB}`).collection("services");
  const adminsCollection = client.db(`${process.env.MY_DB}`).collection("admins");
  
  app.post('/add-service',(req,res)=>{
    const file=req.files.file
    const serviceTitle=req.body.serviceTitle
    const description=req.body.description
    
    const encImg=file.data.toString('base64')
      const image={
        contentType:file.mimetype,
        size:file.size,
        img:Buffer(encImg,'base64')
      }
    
    servicesCollection.insertOne({
      img:image, description, serviceTitle
    })
    .then(result=>{
      res.send(result.insertedCount>0)
      console.log(result)
    })
  })

  app.get('/show-all-service',(req,res)=>{
    servicesCollection.find({})
    .toArray((error,documents)=>{
      res.send(documents)
    })
  })

  app.post('/add-admin',(req,res)=>{
    adminsCollection.insertOne({admin:req.body.admin})
    .then(result=>{
      res.send(result.insertedCount>0)
    })
    .catch(err=>console.log(err))
  })

  app.post('/add-review',(req,res)=>{
    reviewsCollection.insertOne(req.body)
    .then(result=>{
      res.send(result.insertedCount>0)
    })
    .catch(err=>{
      console.log(err)
    })
  })

  app.get('/show-feedbacks',(req,res)=>{
    reviewsCollection.find({})
    .toArray((error, documents)=>{
      res.send(documents)
    })
  })

  app.post('/add-order',(req,res)=>{
    ordersCollection.insertOne(req.body)
    .then(result=>{
      res.send(result.insertedCount>0)
    })
    .catch(error=>console.log(error))
  })

  app.get('/show-orders',(req,res)=>{
    ordersCollection.find({})
    .toArray((error, documents)=>{
      res.send(documents)
    })
  })

  app.get('/show-order-by-mail',(req,res)=>{
    ordersCollection.find({email:req.headers.email})
    .toArray((error, documents)=>{
      res.send(documents)
    })
  })

  app.get('/check-admin',(req,res)=>{
    adminsCollection.find({admin:req.headers.email})
    .toArray((error, documents)=>{
      res.send(documents.length>0)
    })
  })

  app.patch('/update-status',(req,res)=>{
    ordersCollection.updateOne(
      {_id:ObjectID(req.body.id)},
      {
        $set:{'status':req.body.status}
      }
    )
    .then(result=>{
      res.send(result.modifiedCount>0)
    })
    .catch(err=>console.log(err))
  })

  app.delete('/delete-feedback',(req,res)=>{
    reviewsCollection.deleteOne({_id:ObjectID(req.headers.id)})
    .then(result=>{
      res.send(result.deletedCount>0)
    })
    .catch(err=>{
      console.log(err)
    })
  })
  //mongo end
});


const PORT=process.env.PORT || 3001
app.listen(PORT,()=>{
    console.log('Server is running with '+PORT)
})