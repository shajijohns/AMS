USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ams')
BEGIN
    CREATE DATABASE [ams];
END
GO

USE [ams];
GO

IF NOT EXISTS (SELECT name FROM sys.sql_logins WHERE name = 'ams_admin')
BEGIN
    CREATE LOGIN ams_admin WITH PASSWORD = 'AmsSuperSecurePassword2026!';
END
GO

IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'ams_admin')
BEGIN
    CREATE USER ams_admin FOR LOGIN ams_admin;
    ALTER ROLE db_owner ADD MEMBER ams_admin;
END
GO
