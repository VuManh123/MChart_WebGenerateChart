// Định nghĩa các thư mục sẽ sử dụng
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
var sql = require('mssql');
var consoleTable = require('console.table');
const fs = require('fs');
const { connect } = require('http2');
const session = require('express-session');

// Sử dụng body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(session({
    secret: 'manhvu',
    resave: true,
    saveUninitialized: true
}));

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
        req.session.userName = username;
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

        res.json({ success: true, message: "Login successful", userName: username });
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

// 1. List projects
app.get('/projects', (req, res) => {
  const userName = req.session.userName;
  const query = `SELECT * FROM Projects WHERE UserID = (SELECT UserID FROM Users WHERE UserName = '${userName}')`;
  sql.query(query)
    .then((result) => {
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

// 2. Add projects to db
app.post('/addProjects', (req, res) => {
  const userName = req.session.userName;
  const projectName = req.body.projectName;
  const projectDescription = req.body.projectDescription;
  const query = `
      INSERT INTO Projects (ProjectName, Description, UserID)
      VALUES (N'${projectName}','${projectDescription}', (SELECT UserID FROM Users WHERE UserName = '${userName}'))
  `;

  sql.query(query, {
      projectName: projectName,
      projectDescription: projectDescription,
      userName: userName
  })
      .then(() => {
          res.json({ success: true, message: 'Add project successfully' });
      })
      .catch(error => {
          console.log('Error adding projects:', error);
          res.status(500).json({ success: false, message: 'Have an error' });
      });
});

// 3. Add chart not belongs to any projects
app.post('/addChartNotBelongProject', (req, res) => {
  const userName = req.session.userName;
  const chartName = req.body.chartData.datasets[0].label;;  // Lấy tên biểu đồ từ dữ liệu gửi đi
  const data = JSON.stringify(req.body.chartData);  // Lấy toàn bộ dữ liệu biểu đồ dưới dạng JSON

  const query = `
      INSERT INTO Charts (ChartName, Data, UserID)
      VALUES (N'${chartName}', '${data}', (SELECT UserID FROM Users WHERE UserName = '${userName}'))
  `;

  sql.query(query, {
      chartName: chartName,
      data: data,
      userName: userName
  })
      .then(() => {
          res.json({ success: true, message: 'Add chart successfully' });
      })
      .catch(error => {
          console.log('Error adding chart:', error);
          res.status(500).json({ success: false, message: 'Have an error' });
      });
});

// 4. List chart not belong to any projects
app.get('/chartNotBelongProject', (req, res) => {
  const userName = req.session.userName;
  const query = `SELECT * FROM Charts WHERE UserID = (SELECT UserID FROM Users WHERE UserName = '${userName}') AND ProjectID IS NULL`;
  sql.query(query)
    .then((result) => {
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

// 5. List chart belong to project
app.get('/chartBelongProject/:projectID', (req, res) => {
  const userName = req.session.userName;
  const projectID = req.params.projectID;
  const query = `SELECT * FROM Charts WHERE UserID = (SELECT UserID FROM Users WHERE UserName = '${userName}') AND ProjectID ='${projectID}'`;
  sql.query(query)
    .then((result) => {
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

// 6. Rename project
app.post('/updateNameProject', (req, res) => {
  const projectID = req.body.projectID;
  const projectNewName = req.body.projectNewName;
  
  const query = `UPDATE Projects SET ProjectName = N'${projectNewName}' WHERE ProjectID ='${projectID}'`;
  sql.query(query)
      .then(() => {
        res.json({ success: true, message: 'Update project name successfully!' });
      })
      .catch(error => {
        console.log('Error updating project:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi sửa project' });
      });
  });

// 7. Remove project
app.post('/removeProject', (req, res) => {
  const projectID = req.body.projectID;

  const query = `DELETE FROM Charts WHERE ProjectID ='${projectID}';
                DELETE FROM Projects WHERE ProjectID ='${projectID}'`;
  sql.query(query)
    .then(() => {
      res.json({ success: true, message: 'Delete project successfully!' });
    })
    .catch(error => {
      console.log('Error removing project:', error);
      res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi xóa nhân viên' });
    });
});


// 8. Share project
app.post('/shareProject', (req, res) => {
  const role = req.body.role;
  const emailUser = req.body.emailUser;
  const projectID = req.body.projectID;
  const userName = req.session.userName;
  const query = `INSERT INTO ProjectShares (ProjectID, SharedByUserID, SharedWithUserID, AccessLevel) VALUES (N'${projectID}', (SELECT UserID FROM Users WHERE UserName = '${userName}'), (SELECT UserID FROM Users WHERE Email = '${emailUser}'), N'${role}')`;
  sql.query(query)
    .then(() => {
      res.json({ success: true, message: 'Share project successfully!' });
    })
    .catch(error => {
      console.log('Error sharing projects:', error);
      res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi share project' });
    });
});

// 9. View info project
app.post('/listInfoProject', (req, res) => {
  const projectID = req.body.projectID;
  console.log('Received projectID:', projectID);
  const query = `SELECT p.ProjectName, p.Description, p.CreateAt, c.Description AS CheckpointDescription, c.CheckpointDate FROM Projects p LEFT JOIN CheckPoints c ON p.ProjectID = c.ProjectID WHERE p.ProjectID = '${projectID}'`;
  sql.query(query)
    .then((result) => {
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

// 10. View projectDeleted
app.get('/projectsDeleted', (req, res) => {
  const userName = req.session.userName;
  const query = `SELECT * FROM DeletedProjects WHERE UserID = (SELECT UserID FROM Users WHERE UserName = '${userName}')`;
  sql.query(query)
    .then((result) => {
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});
// 11. View chartDeleted not belongs to project
app.get('/chartDeletedNotBelongProject', (req, res) => {
  const userName = req.session.userName;
  const query = `SELECT * FROM DeletedCharts WHERE UserID = (SELECT UserID FROM Users WHERE UserName = '${userName}') AND ProjectID IS NULL`;
  sql.query(query)
    .then((result) => {
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});
// 12. View chartDeleted belongs to project
app.get('/chartDeletedBelongProject/:projectID', (req, res) => {
  const userName = req.session.userName;
  const projectID = req.params.projectID;
  const query = `SELECT * FROM DeletedCharts WHERE UserID = (SELECT UserID FROM Users WHERE UserName = '${userName}') AND ProjectID ='${projectID}'`;
  sql.query(query)
    .then((result) => {
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});
// 13. View projectShared
app.get('/projectsShared', (req, res) => {
  const userName = req.session.userName;
  const query = `SELECT * FROM ProjectShares ps JOIN Projects p ON ps.ProjectID = p.ProjectID WHERE ps.SharedWithUserID = (SELECT UserID FROM Users WHERE UserName = '${userName}')`;
  sql.query(query)
    .then((result) => {
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});