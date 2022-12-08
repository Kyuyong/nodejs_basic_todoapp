const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));
const bodyParser = require('body-parser');
app.set('view engine', 'ejs');

var db;
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb+srv://skons:qwer1234@cluster0.nioo7sz.mongodb.net/todoapp?retryWrites=true&w=majority', function(에러, client){
  if (에러) return console.log(에러);
  db = client.db('todoapp');
  app.listen('8080', function(){
    console.log('mongodb listening on 8080')
  });
});

app.get('/',function(요청, 응답){
  응답.sendFile(__dirname + '/index.html')
});

app.get('/write',function(요청, 응답){
  응답.sendFile(__dirname + '/write.html')
});

app.post('/add', function(요청, 응답){
  응답.send('전송완료');
  db.collection('counter').findOne({name : '게시물갯수'}, function(에러, 결과){
    console.log(결과.totalPost);
    var 총게시물갯수 = 결과.totalPost;

    db.collection('post').insertOne({_id: 총게시물갯수+1 ,제목:요청.body.title, 날짜:요청.body.date, }, function(){
      console.log('저장완료');
      // counter라는 콜렉션 totalPost 항목도 1 증가 필요
      // 수정할때는 operator를 써야함 
      // operator에서 $set은 바꿔주세요. $inc : 기존값에 더해주세요.
      db.collection('counter').updateOne({name:'게시물갯수'},{$inc:{totalPost:1}},function(에러, 결과){
        if(에러) return console.log(에러);
      });
    })
  
  });
});



// /list로 get요청을 접속하면 HTML을 보여줌
app.get('/list', function(요청, 응답){
  
  // DB에 저장된 post라는 collection안의 모든 데이터를 꺼내주세요 
  db.collection('post').find().toArray(function(에러, 결과){
    console.log(결과);
    응답.render('list.ejs', {posts: 결과});
  });  //모든 데이터 다 가져오기 

});