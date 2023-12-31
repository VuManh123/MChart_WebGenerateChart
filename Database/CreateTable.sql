﻿--I. Tạo bảng 
--1. Tạo bảng các user
CREATE TABLE Users (
	STT INT IDENTITY(1, 1),
    UserID AS CONVERT(NVARCHAR(10), 'MU' + RIGHT('00000' + CAST(STT AS VARCHAR(5)), 5)) PERSISTED PRIMARY KEY,
    UserName NVARCHAR(50),
    Password NVARCHAR(255),
    Email NVARCHAR(100),
    CreateAt DATETIME DEFAULT GETDATE()
);

INSERT INTO Users (UserName, Password, Email)
VALUES
    ('user1', 'password1', 'user1@gmail.com'),
    ('user2', 'password2', 'user2@gmail.com'),
    ('user3', 'password3', 'user3@gmail.com')

-- 2. Tạo bảng projects
CREATE TABLE Projects (
	STT INT IDENTITY(1, 1),
    ProjectID AS CONVERT(NVARCHAR(10), 'MP' + RIGHT('00000' + CAST(STT AS VARCHAR(5)), 5)) PERSISTED PRIMARY KEY,
    ProjectName NVARCHAR(255),
    Description NVARCHAR(MAX),
	UserID NVARCHAR(10) FOREIGN KEY REFERENCES Users(UserID),
	CreateAt DATETIME DEFAULT GETDATE()
);
DELETE FROM Charts WHERE ChartID = 'MC00001'

-- Thêm một dự án mới
INSERT INTO Projects (ProjectName, Description, UserID)
VALUES ('Project A', 'Description of Project A', 'MU00001');

-- 3. Tạo bảng biêu đồ trong các projects
CREATE TABLE Charts (
	STT INT IDENTITY(1, 1),
    ChartID AS CONVERT(NVARCHAR(10), 'MC' + RIGHT('00000' + CAST(STT AS VARCHAR(5)), 5)) PERSISTED PRIMARY KEY,
	ChartName NVARCHAR(255),
    Data NVARCHAR(MAX), -- Dữ liệu lưu trữ dưới dạng JSON
	CreateAt DATETIME DEFAULT GETDATE(),
	ProjectID NVARCHAR(10) FOREIGN KEY REFERENCES Projects(ProjectID), 
);
ALTER TABLE Charts
ADD UserID NVARCHAR(10) FOREIGN KEY REFERENCES Users(UserID);
 
-- 4. Tao bang share project
CREATE TABLE ProjectShares (
	STT INT IDENTITY(1, 1),
    ID AS CONVERT(NVARCHAR(12), 'PS' + RIGHT('0000000' + CAST(STT AS VARCHAR(5)), 5)) PERSISTED PRIMARY KEY,
    ProjectID NVARCHAR(10) FOREIGN KEY REFERENCES Projects(ProjectID),
    SharedByUserID NVARCHAR(10) FOREIGN KEY REFERENCES Users(UserID),
    SharedWithUserID NVARCHAR(10) FOREIGN KEY REFERENCES Users(UserID),
	AccessLevel NVARCHAR(10), -- Read/Edit
    ShareDate DATETIME DEFAULT GETDATE()
);

CREATE TABLE ChartShares (
	STT INT IDENTITY(1, 1),
    ID AS CONVERT(NVARCHAR(12), 'CS' + RIGHT('0000000' + CAST(STT AS VARCHAR(5)), 5)) PERSISTED PRIMARY KEY,
    ChartID NVARCHAR(10) FOREIGN KEY REFERENCES Charts(ChartID),
    SharedByUserID NVARCHAR(10) FOREIGN KEY REFERENCES Users(UserID),
    SharedWithUserID NVARCHAR(10) FOREIGN KEY REFERENCES Users(UserID),
	AccessLevel NVARCHAR(10), -- Read/Edit
    ShareDate DATETIME DEFAULT GETDATE()
);

CREATE TABLE CheckPoints (
	STT INT IDENTITY(1, 1),
    ID AS CONVERT(NVARCHAR(12), 'CP' + RIGHT('0000000' + CAST(STT AS VARCHAR(5)), 5)) PERSISTED PRIMARY KEY,
	ProjectID NVARCHAR(10) FOREIGN KEY REFERENCES Projects(ProjectID),
	ChartID NVARCHAR(10) FOREIGN KEY REFERENCES Charts(ChartID),
    UserID NVARCHAR(10) FOREIGN KEY REFERENCES Users(UserID),
	Description NVARCHAR(MAX),
	CheckpointDate DATETIME DEFAULT GETDATE()
);

-- Tạo role cho đăng nhập
-- Phân quyền trong sql server 
CREATE ROLE [Admin]
GRANT CONTROL TO [Admin]

CREATE ROLE [Community]
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Charts TO [Community]
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.ChartShares TO [Community]
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.CheckPoints TO [Community]
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Projects TO [Community]
GRANT SELECT ON SCHEMA::dbo TO [Community]

CREATE ROLE [Master]
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Charts TO [Master]
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.ChartShares TO [Master]
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.CheckPoints TO [Master]
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Projects TO [Master]
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.ProjectShares TO [Master]
GRANT SELECT ON SCHEMA::dbo TO [Master]

USE master;
CREATE LOGIN user1 WITH PASSWORD = 'password1';
CREATE LOGIN user2 WITH PASSWORD = 'password2';
CREATE LOGIN user3 WITH PASSWORD = 'password3';

USE MChart;
CREATE USER user1 FOR LOGIN user1;
ALTER ROLE [Admin] ADD MEMBER user1;
CREATE USER user2 FOR LOGIN user2;
ALTER ROLE [Community] ADD MEMBER user2;
CREATE USER user3 FOR LOGIN user3;
ALTER ROLE [Master] ADD MEMBER user3;

EXEC sp_helplogins 'user1';

-- 1. Tạo bảng Deleted cho Projects
CREATE TABLE DeletedProjects (
    STT INT,
    ProjectID NVARCHAR(10) PRIMARY KEY,
    ProjectName NVARCHAR(255),
    Description NVARCHAR(MAX),
    UserID NVARCHAR(10),
    CreateAt DATETIME
);

-- Trigger cho việc chuyển dữ liệu đã xóa từ Projects vào DeletedProjects
CREATE TRIGGER trg_DeleteProjects
ON Projects
AFTER DELETE
AS
BEGIN
    INSERT INTO DeletedProjects (STT, ProjectID, ProjectName, Description, UserID, CreateAt)
    SELECT STT, ProjectID, ProjectName, Description, UserID, CreateAt
    FROM DELETED;
END;

-- 2. Tạo bảng Deleted cho Charts
CREATE TABLE DeletedCharts (
    STT INT,
    ChartID NVARCHAR(10) PRIMARY KEY,
    ChartName NVARCHAR(255),
    Data NVARCHAR(MAX),
    CreateAt DATETIME,
    ProjectID NVARCHAR(10)
);

ALTER TABLE DeletedCharts
ADD UserID NVARCHAR(10);


CREATE TRIGGER trg_DeleteCharts
ON Charts
AFTER DELETE
AS
BEGIN
    INSERT INTO DeletedCharts (STT, ChartID, ChartName, Data, CreateAt, ProjectID, UserID)
    SELECT STT, ChartID, ChartName, Data, CreateAt, ProjectID, UserID
    FROM DELETED;
END;

-- Trigger cho việc tự động insert vào bảng chartshare khi có 1 projectshare
-- Tạo trigger
CREATE TRIGGER trgInsertChartShares
ON ProjectShares
AFTER INSERT
AS
BEGIN
    -- Insert vào bảng ChartShares
    INSERT INTO ChartShares (ChartID, SharedByUserID, SharedWithUserID, AccessLevel, ShareDate)
    SELECT 
        c.ChartID,
        i.SharedByUserID,
        i.SharedWithUserID,
        i.AccessLevel,
        GETDATE()
    FROM 
        inserted i
    INNER JOIN
        Charts c ON i.ProjectID = c.ProjectID;
END;