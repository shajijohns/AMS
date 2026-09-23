BEGIN TRANSACTION;
CREATE TABLE [ConsentRecords] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [TenantId] uniqueidentifier NOT NULL,
    [ConsentType] int NOT NULL,
    [Version] nvarchar(max) NOT NULL,
    [GrantedUtc] datetime2 NOT NULL,
    [RevokedUtc] datetime2 NULL,
    [IpAddress] nvarchar(max) NULL,
    [CreatedUtc] datetime2 NOT NULL,
    [ModifiedUtc] datetime2 NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedUtc] datetime2 NULL,
    CONSTRAINT [PK_ConsentRecords] PRIMARY KEY ([Id])
);

CREATE TABLE [FamilyMembers] (
    [Id] uniqueidentifier NOT NULL,
    [MemberId] uniqueidentifier NOT NULL,
    [Relationship] nvarchar(max) NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [DOB_Encrypted] nvarchar(max) NULL,
    [CreatedUtc] datetime2 NOT NULL,
    [ModifiedUtc] datetime2 NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedUtc] datetime2 NULL,
    CONSTRAINT [PK_FamilyMembers] PRIMARY KEY ([Id])
);

CREATE TABLE [Invitations] (
    [Id] uniqueidentifier NOT NULL,
    [TenantId] uniqueidentifier NOT NULL,
    [MemberId] uniqueidentifier NOT NULL,
    [TokenHash] nvarchar(max) NOT NULL,
    [ExpiresUtc] datetime2 NOT NULL,
    [UsedUtc] datetime2 NULL,
    [ResentCount] int NOT NULL,
    [CreatedUtc] datetime2 NOT NULL,
    [ModifiedUtc] datetime2 NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedUtc] datetime2 NULL,
    CONSTRAINT [PK_Invitations] PRIMARY KEY ([Id])
);

CREATE TABLE [Members] (
    [Id] uniqueidentifier NOT NULL,
    [TenantId] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NULL,
    [MemberNumber] nvarchar(max) NOT NULL,
    [FirstName] nvarchar(max) NOT NULL,
    [LastName] nvarchar(max) NOT NULL,
    [DOB_Encrypted] nvarchar(max) NULL,
    [Email_Encrypted] nvarchar(max) NOT NULL,
    [Phone_Encrypted] nvarchar(max) NULL,
    [AddressJson_Encrypted] nvarchar(max) NULL,
    [MembershipType] nvarchar(max) NOT NULL,
    [Status] int NOT NULL,
    [JoinDate] datetime2 NULL,
    [ValidThrough] datetime2 NULL,
    [RowVersion] rowversion NULL,
    [CreatedUtc] datetime2 NOT NULL,
    [ModifiedUtc] datetime2 NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedUtc] datetime2 NULL,
    CONSTRAINT [PK_Members] PRIMARY KEY ([Id])
);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260911001249_AddPhase3Entities', N'9.0.0');

COMMIT;
GO

