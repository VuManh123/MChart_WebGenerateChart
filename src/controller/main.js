// Định nghĩa các thư mục sẽ sử dụng
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
var sql = require('mssql');
var consoleTable = require('console.table');
const fs = require('fs');
const { connect } = require('http2');
app.use( express.static('public'));
// Sử dụng body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Cấu hình đường dẫn cho các tệp HTML
const htmlDir = path.join(__dirname, 'views');
// Thiết lập Db
const configForLogIn = {
  server: 'MANHVU',
  database: 'MChart',
  port: 1433,
  authentication: {
    type: 'default',
    options: {
      userName: 'sa',
      password: 'manhvu123'
    }
  },
  options: {
    encrypt: false,
    enableArithAbort: true
  }
};

// Kết nối với Db để lấy thông tin bảng Users
sql.connect(configForLogIn, function(err) {
  if (err) {
    console.log("Failed to connect to database: " + err);
  } else {
    console.log("Connected to database to get Users table info");
  }
});
app.post('/logout', function(req, res) {
  // Ngắt kết nối config
  sql.close(function(err) {
    if (err) {
      console.log("Failed to close database connection: " + err);
    } else {
      console.log("Closed database connection");
    }
  });

  // Kết nối lại với configForLogIn
  sql.connect(configForLogIn, function(err) {
    if (err) {
      console.log("Failed to connect to database: " + err);
    } else {
      console.log("Connected to database to get Users table info");
    }
  });

  // Chuyển hướng người dùng về trang đăng nhập
  res.redirect('/login.html');
});

app.post('/login', function(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  // Tạo truy vấn SQL để kiểm tra thông tin đăng nhập
  const query = `SELECT * FROM Users WHERE username LIKE '%${username}%' AND password LIKE '%${password}%'`;

  // Thực hiện truy vấn SQL
  const request = new sql.Request();
  request.query(query, function(err, result) {
    if (err) {
      console.log("Error executing SQL query: " + err);
      res.json({ success: false, message: "Error executing SQL query" });
    } else {
      // Kiểm tra kết quả truy vấn
      if (result.recordset.length > 0) {
        // Đóng kết nối configForLogIn sau khi đăng nhập thành công
        sql.close(function(err) {
          if (err) {
            console.log("Failed to close database connection: " + err);
          } else {
            console.log("Closed database connection");
          }
        });

        // Thiết lập Db để thực hiện các chức năng khác
        const config = {
          server: 'MANHVU',
          database: 'CarRental',
          port: 1433,
          authentication: {
            type: 'default',
            options: {
              userName: username,
              password: password
            }
          },
          options: {
            encrypt: false,
            enableArithAbort: true
          }
        };

        // Kết nối với Db để thực hiện các chức năng khác
        sql.connect(config, function(err) {
          if (err) {
            console.log("Failed to connect to database: " + err);
          } else {
            console.log("Connected to database for other functions");
          }
        });

        res.json({ success: true, message: "Login successful" });
      } else {
        res.json({ success: false, message: "Invalid username or password" });
      }
    }
  });
});
// Reset lai cac ket noi khi dang xuat
module.exports = connect ;
// Định vị thư mục chứa các tệp tĩnh
app.use('/assets', express.static(path.join(__dirname, 'views', 'assets')));

// Định vị thư mục chứa các tệp HTML
app.set('views', path.join(__dirname, 'views'));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// Xử lý các yêu cầu truy cập các tệp HTML
app.use((req, res, next) => {
  const filePath = path.join(htmlDir, req.path);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });
});