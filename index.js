var path = require("path");
var express = require("express");
var mockjs = require("express-mockjs");
var cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

var app = express();
const corsOptions ={
  origin: /cloud\.tencent\.com/,
  credentials: true,
  maxAge: 600
}
app.options('*', cors(corsOptions))
app.use(cors(corsOptions))
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
app.use(cookieParser())
// 使用默认路径 '/'（不推荐）
// app.use(mockjs(path.join(__dirname, 'mocks')))

// 自定义路径 '/api'
app.use("/api/", mockjs(path.join(__dirname, "data")));

// 这里可以添加你的自定义代码.
app.listen(3001, () => {
  console.info('start mock server at 3001')
});
