const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));
const bodyParser = require('body-parser');

var db;
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb+srv://skons:qwer1234@cluster0.nioo7sz.mongodb.net/todoapp?retryWrites=true&w=majority', function(에러, client){
  if (에러) return console.log(에러);
  //서버띄우는 코드 여기로 옮기기

  db = client.db('todoapp');

  db.collection('post').insertOne( {이름 : 'John', _id : 100} , function(에러, 결과){
  console.log('저장완료'); 
  });
  app.listen('8080', function(){
    console.log('listening on 8080')
  });
});

// const { MongoClient } = require("mongodb");
// const username = encodeURIComponent("skons");
// const password = encodeURIComponent("qwer1234");
// const cluster = "cluster0";
// const authSource = "<authSource>";
// const authMechanism = "<authMechanism>";


// let uri =
//   `mongodb+srv://skons:<qwer1234>@cluster0.nioo7sz.mongodb.net/?retryWrites=true&w=majority`;
// const client = new MongoClient(uri);
// async function run() {
//   try {
//     await client.connect();
//     const database = client.db("<dbName>");
//     const ratings = database.collection("<collName>");
//     const cursor = ratings.find();
//     await cursor.forEach(doc => console.dir(doc));
//   } finally {
//     await client.close();
//   }
// }
// run().catch(console.dir);



// app.listen(8080, function(){
//   console.log('listening on 8080 : first')
// });


app.get('/',function(요청, 응답){
  응답.sendFile(__dirname + '/index.html')
});

app.get('/write',function(요청, 응답){
  응답.sendFile(__dirname + '/write.html')
});


// 어떤 사람이 /add 경로로 POST 요청을 하면 ...를 해주세요 
app.post('/add', function(요청, 응답){
  응답.send('전송완료');
  console.log(요청.body);
  // DB에 저장해주세요
});
