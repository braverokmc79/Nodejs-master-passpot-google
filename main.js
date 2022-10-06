const express = require('express')
const fs = require('fs');
const bodyParser = require('body-parser')
const compression = require('compression')
const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session);
const flash = require('connect-flash');
const app = express()
const port = 3000
const helmet = require('helmet')


app.use(helmet())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());


// session DB 저장 방식 - session 테이블이 자동 생성되고  세션이 passport의해 저장 된다.
app.use(session({
  secret: '12312dajfj23rj2po4$#%@#',
  resave: false,
  saveUninitialized: true,
  store: new MySQLStore({
    host: 'localhost',
    port: 3306,
    user: 'opentutorials',
    password: '1111',
    database: 'opentutorials'
  })
}));

app.use(flash());
const passport = require("./lib/passport")(app);

app.get('*', (req, res, next) => {
  fs.readdir('./data', function (error, filelist) {
    req.list = filelist;
    next();
  });
});


const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth")(passport);
const topicRouter = require("./routes/topic");

app.use("/", indexRouter);
app.use('/auth', authRouter);
app.use('/topic', topicRouter);



app.use(function (req, res) {
  res.status(400).send("Sorry cant find that!");
});

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

