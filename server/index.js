const newrelic = require('newrelic');
const express = require ('express');
const axios = require('axios');
const PORT = 5001;
const app = express();
const path = require('path'); 
const morgan = require('morgan');
const bodyParser = require('body-parser');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();
const redis = require('redis');

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use('/:id', express.static(path.join(__dirname, '/../client')));

const redisClient = redis.createClient({
    port:6380
})

const gallery = 'http://34.217.16.94';
const reservation = 'http://54.183.216.157';
// const popular = 'http://localhost:3002';
const header = 'http://18.188.246.230';

redisClient.on('error', (err) => {
    console.log("Error " + err);
});

var cacheImage = (req,res,next) => {
    let num = req.params.id;
    redisClient.get(num.toString(),(err,data)=>{
        if(err){
            res.status(500).send(err); 
        } 
        if(data !== null){
            res.send(JSON.parse(data))
        } else {
            next();
        }
    })
};

var cacheRestaurantCapacity = (req,res,next) => {
    let num = req.params.id;
    redisClient.get((`${num}resCapacity`).toString(),(err,data)=>{
        if(err){
            res.status(500).send(err); 
        } 
        if(data !== null){
            res.send(JSON.parse(data))
        } else {
            next();
        }
    })
};

var cacheReservation = (req,res,next) => {
    let num = req.params.id;
    let timestamp = req.query.timestamp;
    redisClient.get((num.toString() + timestamp.toString()),(err,data)=>{
        if(err){
            res.status(500).send(err); 
        } 
        if(data !== null){
            res.send(JSON.parse(data))
        } else {
            next();
        }
    })
};

var cacheHeader = (req,res,next) => {
    let num = req.params.id;
    redisClient.get((`${num}header`).toString(),(err,data)=>{
        if(err){
            res.status(500).send(err); 
        } 
        if(data !== null){
            res.send(JSON.parse(data))
        } else {
            next();
        }
    })
};

app.get('/:id/gallery',cacheImage,(req,res)=>{
    var num = req.params.id;
    axios.get(`http://34.217.16.94/${num}/gallery`)
    .then(({data})=>{
        redisClient.set(num.toString(),JSON.stringify(data));
        res.send(data); 
    })
})

app.get('/:id/restaurantCapacity', cacheRestaurantCapacity, (req, res) => {
    var num = req.params.id;
    axios.get(`http://54.183.216.157/${num}/restaurantCapacity`)
    .then(({data})=>{
        redisClient.set((`${num}resCapacity`).toString(), JSON.stringify(data.rows));
        res.json(data);
    })
});

app.get('/:id/reservation', cacheReservation, (req, res) => {
    var num = req.params.id;
    var { timestamp } = req.query;
    axios.get(`http://54.183.216.157/${num}/reservation?timestamp=${timestamp}`)
    .then(({data})=>{
        redisClient.set((num.toString() + timestamp.toString()), JSON.stringify(data.rows));
        res.json(data);
    })
});

// app.all('/popular/:id', function(req, res) {
//     console.log('redirecting to popular');
//     proxy.web(req, res, { target: popular });
// });

app.get('/:id/header', cacheHeader,(req, res) => {
    var num = req.params.id;
    axios.get(`http://18.188.246.230/${num}/header`)
      .then((data) => {
        redisClient.set((`${num}header`).toString(), JSON.stringify({ header: data.data.rows, categories: data.data.rows, reviews: data.data.rows }));
        res.send({ header: data.data.header, categories: data.data.categories, reviews: data.data.reviews });
      })
});


app.listen(PORT, ()=> console.log(`Server listening on port ${PORT}`))
