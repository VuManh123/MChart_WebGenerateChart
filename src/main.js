// Định nghĩa các thư mục sẽ sử dụng
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
var sql = require('mssql');
var consoleTable = require('console.table');
const fs = require('fs');
const { connect } = require('http2');

// Sử dụng body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Cấu hình đường dẫn cho các tệp HTML
const htmlDir = path.join(__dirname, 'views', 'pages');

// Thiết lập Db cho trang đăng nhập
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

// Endpoint đăng xuất
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
// Endpoint đăng nhập
app.post('/login', function(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  // Tạo truy vấn SQL để kiểm tra thông tin đăng nhập
  const query = `SELECT * FROM Users WHERE UserName LIKE '%${username}%' AND Password LIKE '%${password}%'`;

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
          database: 'MChart',
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
app.use('/styles', express.static(path.join(__dirname, 'views', 'styles')));
app.use('/models', express.static(path.join(__dirname, 'models')));
app.use('/controller', express.static(path.join(__dirname, 'controller')));
app.use('/images', express.static(path.join(__dirname, 'views', 'images')));

// Định vị thư mục chứa các tệp HTML
app.set('pages', path.join(__dirname, 'pages'));

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

// Khởi động máy chủ
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});

// Truy vấn project, chart
app.get('/projects', (req, res) => {
  // Thực hiện truy vấn SQL để lấy thông tin về các loại xe
  const query = 'SELECT * FROM Projects';
  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});