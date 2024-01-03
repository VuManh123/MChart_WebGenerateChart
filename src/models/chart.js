// console.log('Chart.js is running!');
// const express = require('express');
// const sql = require('mssql');
// const bodyParser = require('body-parser');

// const chartRouter = express.Router();

// chartRouter.use(bodyParser.json());
// chartRouter.use(bodyParser.urlencoded({ extended: true }));

// chartRouter.post('/addChartBelongProject', (req, res) => {
//     const userName = req.session.userName;
//     const project = req.body.project;
//     console.log(project);
//     const chartName = req.body.chartData.datasets[0].label;
//     const data = JSON.stringify(req.body.chartData);
  
//     const query = `
//         INSERT INTO Charts (ChartName, Data, UserID, ProjectID)
//         VALUES (N'${chartName}', '${data}', (SELECT UserID FROM Users WHERE UserName = '${userName}'), '${project}')
//     `;
  
//     sql.query(query, {
//       chartName: chartName,
//       data: data,
//       userName: userName,
//       project: project
//     })
//     .then(() => {
//       res.json({ success: true, message: 'Thêm biểu đồ thành công' });
//     })
//     .catch(error => {
//       console.log('Lỗi khi thêm biểu đồ:', error.message);
//       res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
//     });
//   });

// module.exports = chartRouter;