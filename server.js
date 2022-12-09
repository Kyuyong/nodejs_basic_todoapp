const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));
const bodyParser = require('body-parser');
app.set('view engine', 'ejs');
const methodOverride = require('method-override');
app.use(methodOverride('_method'));


app.use('/public', express.static('public'));

var db;
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb+srv://skons:qwer1234@cluster0.nioo7sz.mongodb.net/todoapp?retryWrites=true&w=majority', function(에러, client){
  if (에러) return console.log(에러);
  db = client.db('todoapp');
  app.listen('8080', function(){
    console.log('mongodb listening on 8080')
  });
});

// app.get('/',function(요청, 응답){
//   응답.sendFile(__dirname + '/index.ejs')
// });

// app.get('/write',function(요청, 응답){
//   응답.sendFile(__dirname + '/write.ejs')
// });

app.get('/', function(요청, 응답){
  응답.render('index.ejs')
});

app.get('/write', function(요청, 응답){
  응답.render('write.ejs')
});

app.post('/add', function(요청, 응답){
  응답.send('전송완료');
  db.collection('counter').findOne({name : '게시물갯수'}, function(에러, 결과){
    // console.log(결과.totalPost);
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

app.delete('/delete', function(요청, 응답){
  console.log(요청.body);
  요청.body._id = parseInt(요청.body._id);
  db.collection('post').deleteOne(요청.body, function(에러,결과){
    console.log('삭제완료');
    응답.status(200).send({message : '성공했습니다.' });
  })

});

// /detail/1 로 접속하면 detail1.ejs 보여줌 
// /detail/2 로 접속하면 detail2.ejs 보여줌 

app.get('/detail/:id', function(요청, 응답){
  db.collection('post').findOne({_id: parseInt(요청.params.id)}, function(에러, 결과){
    console.log(결과);
    응답.render('detail.ejs', { data : 결과})
  });
});


app.get('/edit/:id', function(요청, 응답){

  // edit/2 접속하면 2번 게시물 제목과 날짜를 edit.ejs로 보내줌
  db.collection('post').findOne({_id: parseInt(요청.params.id)}, function(에러, 결과){
    console.log(결과)
    응답.render('edit.ejs',{post:결과});
    
  });

});

app.put('/edit', function(요청,응답){
  // 폼에 담긴 제목, 날짜 데이터를 가지고 db.collection 업데이트함. 
  db.collection('post').updateOne({_id: parseInt(요청.body.id) },{$set: {제목: 요청.body.title, 날짜: 요청.body.date}}, function(에러, 결과){
    if(에러) return console.log(에러);
    console.log('수정완료');
    응답.redirect('/list');
  });
});


// 회원 가입 가능을 만들기 위한 라이브러리 
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');


app.use(session({secret: '비밀코드', resave: true, saveUninitialized: false}));
app.use(passport.initialize());  // 미들웨어
app.use(passport.session());  // 미들웨어 

app.get('/login', function(요청, 응답){
  응답.render('login.ejs')
});

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/fail'
}),  function(요청, 응답){
  응답.redirect('/')
});


//로그인 했을때 마인페이지 넘어가기
app.get('/mypage',로그인했니, function(요청, 응답){
  console.log(요청.user);  //passport.deserializeUser 에서 가져온 정보
  응답.render('mypage.ejs', {사용자: 요청.user})
});
//로그인 검증 함수
function 로그인했니(요청, 응답, next){
  if(요청.user){
    next()
  }else{
    응답.send('로그인 안하셨는데요??')
  }
};

//로그인 서버와 비교 인증과정 
passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
  //console.log(입력한아이디, 입력한비번);
  db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)

    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
    if (입력한비번 == 결과.pw) {
      return done(null, 결과)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));

// id를 이용해서 세션을 저장시키는 코드 (로그인 성공시 발동))
passport.serializeUser(function(user, done){
  done(null, user.id)
});

// 마이페이지 접속시 발동 
passport.deserializeUser(function(아이디, done){
  // DB 에서 user.id로 user를 찾은 뒤에 유저 정보를 아래에 넣음
  db.collection('login').findOne({id: 아이디}, function(에러, 결과){

    done(null, 결과)
  })
});