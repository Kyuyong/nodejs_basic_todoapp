const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
const bodyParser = require('body-parser');
app.set('view engine', 'ejs');
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
const { ObjectId } = require('mongodb');


app.use('/public', express.static('public'));
require('dotenv').config();

const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

var db;
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect(process.env.DB_URL, function (에러, client) {
  if (에러) return console.log(에러);
  db = client.db('todoapp');
  http.listen(process.env.PORT, function () {
    console.log('mongodb listening on 8080')
  });
});

app.get('/', function (요청, 응답) {
  응답.render('index.ejs')
});

app.get('/write', function (요청, 응답) {
  응답.render('write.ejs')
});




// /list로 get요청을 접속하면 HTML을 보여줌
app.get('/list', function (요청, 응답) {

  // DB에 저장된 post라는 collection안의 모든 데이터를 꺼내주세요 
  db.collection('post').find().toArray(function (에러, 결과) {
    console.log(결과);
    응답.render('list.ejs', { posts: 결과 });
  });  //모든 데이터 다 가져오기 

});

app.get('/search', (요청, 응답) => {
  var 검색조건 = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: 요청.query.value,
          path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        }
      }
    },
    { $sort: { _id: 1 } }, // id순으로 정렬하고 싶을때,
    // {$limit : 10 }, // 상위 몇개 자르고 싶을때
    // {$project: {제목: 1, _id: 0, score: {$meta: "searchScore"}}} // 묶어서 검색하고 싶을때, searchScore 검색어 연광성 점수 보여줌 
  ]

  db.collection('post').aggregate(검색조건).toArray(function (에러, 결과) {
    console.log(결과);
    응답.render('search.ejs', { posts: 결과 });
  });
});







// /detail/1 로 접속하면 detail1.ejs 보여줌 
// /detail/2 로 접속하면 detail2.ejs 보여줌 

app.get('/detail/:id', function (요청, 응답) {
  db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
    console.log(결과);
    응답.render('detail.ejs', { data: 결과 })
  });
});


app.get('/edit/:id', function (요청, 응답) {

  // edit/2 접속하면 2번 게시물 제목과 날짜를 edit.ejs로 보내줌
  db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
    console.log(결과)
    응답.render('edit.ejs', { post: 결과 });

  });

});

app.put('/edit', function (요청, 응답) {
  // 폼에 담긴 제목, 날짜 데이터를 가지고 db.collection 업데이트함. 
  db.collection('post').updateOne({ _id: parseInt(요청.body.id) }, { $set: { 제목: 요청.body.title, 날짜: 요청.body.date } }, function (에러, 결과) {
    if (에러) return console.log(에러);
    console.log('수정완료');
    응답.redirect('/list');
  });
});


// 회원 가입 가능을 만들기 위한 라이브러리 
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');


app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());  // 미들웨어
app.use(passport.session());  // 미들웨어 

app.get('/login', function (요청, 응답) {
  응답.render('login.ejs')
});

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/fail'
}), function (요청, 응답) {
  응답.redirect('/')
});


//로그인 했을때 마인페이지 넘어가기
app.get('/mypage', 로그인했니, function (요청, 응답) {
  console.log(요청.user);  //passport.deserializeUser 에서 가져온 정보
  응답.render('mypage.ejs', { 사용자: 요청.user })
});
//로그인 검증 함수
function 로그인했니(요청, 응답, next) {
  if (요청.user) {
    next()
  } else {
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
passport.serializeUser(function (user, done) {
  done(null, user.id)
});

// 마이페이지 접속시 발동 
passport.deserializeUser(function (아이디, done) {
  // DB 에서 user.id로 user를 찾은 뒤에 유저 정보를 아래에 넣음
  db.collection('login').findOne({ id: 아이디 }, function (에러, 결과) {

    done(null, 결과)
  })
});


app.post('/register', function (요청, 응답) {
  db.collection('login').insertOne({ id: 요청.body.id, pw: 요청.body.pw }, function (에러, 결과) {
    응답.redirect('/')
  }) //ID중복체크, ID 영어검사, PW 검사 
});



// 작성자를 구분해서 post 를 작성하게 함
app.post('/add', function (요청, 응답) {

  응답.send('전송완료');
  db.collection('counter').findOne({ name: '게시물갯수' }, function (에러, 결과) {
    console.log(결과.totalPost);
    var 총게시물갯수 = 결과.totalPost;

    var 저장할거 = { _id: 총게시물갯수 + 1, 작성자: 요청.user._id, 제목: 요청.body.title, 날짜: 요청.body.date, };

    db.collection('post').insertOne(저장할거, function (에러, 결과) {
      console.log('저장완료');
      // counter라는 콜렉션 totalPost 항목도 1 증가 필요
      // 수정할때는 operator를 써야함 
      // operator에서 $set은 바꿔주세요. $inc : 기존값에 더해주세요.
      db.collection('counter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (에러, 결과) {
        if (에러) return console.log(에러);
      });
    })

  });
});


// 삭제도 작성자만 삭제할수 있도록
app.delete('/delete', function (요청, 응답) {
  console.log(요청.body);
  요청.body._id = parseInt(요청.body._id);

  var 삭제할데이터 = { _id: 요청.body._id, 작성자: 요청.user._id }

  db.collection('post').deleteOne(삭제할데이터, function (에러, 결과) {
    console.log('삭제완료');
    if (에러) { console.log(에러) };
    응답.status(200).send({ message: '성공했습니다.' });
  })

});


// 페이지가 많을때는 페이지들을 라우트로 따로 관리가 가능함
app.use('/shop', require('./routes/shop.js'));
app.use('/board/sub', require('./routes/board.js'));

// app.get('/shop/shirts', function(요청, 응답){
//   응답.send('셔츠 파는 페이지입니다.');
// });

// app.get('/shop/pants', function(요청, 응답){
//   응답.send('바지 파는 페이지입니다.');
// });

let multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/image')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
    // 날짜를 붙히고 싶을땐, orginalname + new date()
  }

});

var path = require('path');
var upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return callback(new Error('PNG, JPG만 업로드하세요'))
    }
    callback(null, true)
  },
  limits: {
    fileSize: 1024 * 1024
  }
});

app.get('/upload', function (요청, 응답) {
  응답.render('upload.ejs')
});

// 한개만 올리고 싶을땐
app.post('/upload', upload.single("profile"), function (요청, 응답) {
  응답.send('업로드 완료');
});

// 여러개 파일을 올리고 싶을땐, 
// app.post('/upload', upload.array("profile", 10), function(요청, 응답){
//   응답.send('업로드 완료');
// });


app.get('/image/:imageName', function (요청, 응답) {
  응답.sendFile(__dirname + '/public/image/' + 요청.params.imageName)
});

app.post('/chatroom', 로그인했니, function (요청, 응답) {
  var 저장할거 = {
    title: '무슨채팅방',
    member: [ObjectId(요청.body.당한사람id), 요청.user._id],
    date: new Date()
  };
  db.collection('chatroom').insertOne(저장할거).then((결과) => {
    응답.send('성공');
  });
});

app.get('/chat', 로그인했니, function (요청, 응답) {
  db.collection('chatroom').find({ member: 요청.user._id }).toArray().then((결과) => {
    응답.render('chat.ejs', { data: 결과 });
  });

});

app.post('/message', 로그인했니, function (요청, 응답) {

  var 저장할거 = {
    parent: 요청.body.parent,
    content: 요청.body.content,
    userid: 요청.user._id,
    date: new Date(),

  };

  db.collection('message').insertOne(저장할거).then(() => {
    console.log('성공');
    응답.send('DB저장성공')
  });

});

app.get('/message/:id', 로그인했니, function (요청, 응답) {

  응답.writeHead(200, {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });
  db.collection('message').find({ parent: 요청.params.id }).toArray().then((결과) => {
    응답.write('event: test\n');
    응답.write('data:' + JSON.stringify(결과) + '\n\n');

  });

  const pipeline = [
    { $match: { 'fullDocument.parent' : 요청.params.id } }
  ];

  const collection = db.collection('message');
  const changeStream = collection.watch(pipeline);

  changeStream.on('change', (result) => {
    응답.write('event: test\n');
    응답.write('data:' + JSON.stringify([result.fullDocument]) + '\n\n');
    
  });

}); 


app.get('/socket', function(요청, 응답){
  응답.render('socket.ejs');
});

io.on('connection', function(socket){
  console.log('접속됨');

  socket.on('room1-send', function(data){
    io.to('room1').emit('broadcast',data);
  });

  
  socket.on('joinroom', function(data){
    socket.join('room1');
  });

  socket.on('user-send', function(data){
    console.log(data);
    io.emit('broadcast', data);
  });


});