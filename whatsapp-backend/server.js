//importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from 'pusher';
import cors from 'cors';

//app-config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1107495",
    key: "1255ea42d020c286557a",
    secret: "04c4dc24350b5ac873cb",
    cluster: "ap2",
    useTLS: true
  });

//middleware
app.use(express.json());
app.use(cors());
// app.use((req,res,next)=>{
//     res.setHeader("Access-Control-Allow-Origin","*");
//     res.setHeader("Access-Control-Allow-Headers","*");
//     next();
// });

//DB Config
const connection_url = 'mongodb+srv://admin:FaceB00k24@cluster0.um9vw.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connection_url,{
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

//???
const db = mongoose.connection
db.once('open',()=>{
    console.log('DB connected');

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();
    changeStream.on('change',(change)=>{
        console.log('A change occured.',change);

        if(change.operationType === 'insert' ) {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',{
                name:messageDetails.name,
                message:messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            });
        } else {
            console.log('error triggering pusher');
        }

    
    })

})

//api routes
app.get('/',(req,res)=> res.status(200).send('hello world'));

app.get('/messages/sync', (req,res)=>{
    Messages.find((err,data) => {
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).send(data);
        }
    })
})

app.post('/messages/new',(req,res)=>{
    const dbMessage = req.body

    Messages.create(dbMessage, (err,data)=>{
        if(err){
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })
})


//listen
app.listen(port,()=>console.log(`listening on localhost: ${port}`));