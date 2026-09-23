BEGIN TRANSACTION;
CREATE TABLE [AssociationRequests] (
    [Id] uniqueidentifier NOT NULL,
    [Status] int NOT NULL,
    [PayloadJson] nvarchar(max) NOT NULL,
    [SubmittedByEmail] nvarchar(max) NOT NULL,
    [ReviewerNotes] nvarchar(max) NULL,
    [DecisionUtc] datetime2 NULL,
    [DecidedByUserId] uniqueidentifier NULL,
    [SecureOnboardingToken] nvarchar(max) NULL,
    [TokenExpiresUtc] datetime2 NULL,
    [CreatedUtc] datetime2 NOT NULL,
    [ModifiedUtc] datetime2 NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedUtc] datetime2 NULL,
    CONSTRAINT [PK_AssociationRequests] PRIMARY KEY ([Id])
);

CREATE TABLE [Officers] (
    [Id] uniqueidentifier NOT NULL,
    [TenantId] uniqueidentifier NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Email_Encrypted] nvarchar(max) NOT NULL,
    [Phone_Encrypted] nvarchar(max) NOT NULL,
    [TermStart] datetime2 NULL,
    [TermEnd] datetime2 NULL,
    [ElectionDate] datetime2 NULL,
    [CreatedUtc] datetime2 NOT NULL,
    [ModifiedUtc] datetime2 NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedUtc] datetime2 NULL,
    CONSTRAINT [PK_Officers] PRIMARY KEY ([Id])
);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260911000757_AddPhase2Entities', N'9.0.0');

COMMIT;
GO

