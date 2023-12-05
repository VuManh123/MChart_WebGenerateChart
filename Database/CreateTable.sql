--I. Tạo bảng 
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
    ('User1', 'pass1', 'user1@example.com'),
    ('User2', 'pass2', 'user2@example.com'),
    ('User3', 'pass3', 'user3@example.com'),
    ('User4', 'pass4', 'user4@example.com'),
    ('User5', 'pass5', 'user5@example.com');

-- 2. Tạo bảng projects
CREATE TABLE Projects (
	STT INT IDENTITY(1, 1),
    ProjectID AS CONVERT(NVARCHAR(10), 'MP' + RIGHT('00000' + CAST(STT AS VARCHAR(5)), 5)) PERSISTED PRIMARY KEY,
    ProjectName NVARCHAR(255),
    Description NVARCHAR(MAX),
	UserID NVARCHAR(10) FOREIGN KEY REFERENCES Users(UserID),
	CreateAt DATETIME DEFAULT GETDATE()
);

-- Thêm một dự án mới
INSERT INTO Projects (ProjectName, Description)
VALUES ('Project A', 'Description of Project A');

-- 3. Tạo bảng biêu đồ trong các projects
CREATE TABLE Charts (
	STT INT IDENTITY(1, 1),
    ChartID AS CONVERT(NVARCHAR(10), 'MC' + RIGHT('00000' + CAST(STT AS VARCHAR(5)), 5)) PERSISTED PRIMARY KEY,
	ChartName NVARCHAR(255),
    Data NVARCHAR(MAX), -- Dữ liệu lưu trữ dưới dạng JSON
	CreateAt DATETIME DEFAULT GETDATE(),
	ProjectID NVARCHAR(10) FOREIGN KEY REFERENCES Projects(ProjectID),
);

-- 4. Tao bang share project
CREATE TABLE ProjectShares (
    ProjectID NVARCHAR(10) FOREIGN KEY REFERENCES Projects(ProjectID),
    SharedByUserID NVARCHAR(10) FOREIGN KEY REFERENCES Users(UserID),
    SharedWithUserID NVARCHAR(10) FOREIGN KEY REFERENCES Users(UserID),
	AccessLevel NVARCHAR(10), -- Read/Edit
    ShareDate DATETIME DEFAULT GETDATE()
);

CREATE TABLE ChartShares (
    ChartID NVARCHAR(10) FOREIGN KEY REFERENCES Charts(ChartID),
    SharedByUserID NVARCHAR(10) FOREIGN KEY REFERENCES Users(UserID),
    SharedWithUserID NVARCHAR(10) FOREIGN KEY REFERENCES Users(UserID),
	AccessLevel NVARCHAR(10), -- Read/Edit
    ShareDate DATETIME DEFAULT GETDATE()
);

CREATE TABLE CheckPoints (
	ProjectID NVARCHAR(10) FOREIGN KEY REFERENCES Projects(ProjectID),
	ChartID NVARCHAR(10) FOREIGN KEY REFERENCES Charts(ChartID),
    UserID NVARCHAR(10) FOREIGN KEY REFERENCES Users(UserID),
	Description NVARCHAR(MAX),
	CheckpointDate DATETIME
);