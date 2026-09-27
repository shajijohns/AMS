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

CREATE TABLE [Invoices] (
    [Id] uniqueidentifier NOT NULL,
    [TenantId] uniqueidentifier NOT NULL,
    [MemberId] uniqueidentifier NOT NULL,
    [InvoiceNumber] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [AmountDue] decimal(18,2) NOT NULL,
    [AmountPaid] decimal(18,2) NOT NULL,
    [Currency] nvarchar(max) NOT NULL,
    [Status] int NOT NULL,
    [IssueDate] datetime2 NOT NULL,
    [DueDate] datetime2 NOT NULL,
    [CreatedUtc] datetime2 NOT NULL,
    [ModifiedUtc] datetime2 NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedUtc] datetime2 NULL,
    CONSTRAINT [PK_Invoices] PRIMARY KEY ([Id])
);

CREATE TABLE [PaymentMethods] (
    [Id] uniqueidentifier NOT NULL,
    [TenantId] uniqueidentifier NOT NULL,
    [MemberId] uniqueidentifier NOT NULL,
    [Type] int NOT NULL,
    [GatewayToken] nvarchar(max) NOT NULL,
    [Last4] nvarchar(max) NOT NULL,
    [ExpiryMonth] nvarchar(max) NOT NULL,
    [ExpiryYear] nvarchar(max) NOT NULL,
    [IsDefault] bit NOT NULL,
    [CreatedUtc] datetime2 NOT NULL,
    [ModifiedUtc] datetime2 NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedUtc] datetime2 NULL,
    CONSTRAINT [PK_PaymentMethods] PRIMARY KEY ([Id])
);

CREATE TABLE [Payments] (
    [Id] uniqueidentifier NOT NULL,
    [TenantId] uniqueidentifier NOT NULL,
    [MemberId] uniqueidentifier NOT NULL,
    [InvoiceId] uniqueidentifier NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [PaymentDate] datetime2 NOT NULL,
    [GatewayTransactionId] nvarchar(max) NOT NULL,
    [IsSuccessful] bit NOT NULL,
    [CreatedUtc] datetime2 NOT NULL,
    [ModifiedUtc] datetime2 NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedUtc] datetime2 NULL,
    CONSTRAINT [PK_Payments] PRIMARY KEY ([Id])
);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260911002349_AddPhase4BillingEntities', N'9.0.0');

ALTER TABLE [AssociationRequests] ADD [TenantUniqueId] nvarchar(max) NOT NULL DEFAULT N'';

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260912010727_AddTenantUniqueIdToRequests', N'9.0.0');

CREATE TABLE [SystemConfigurations] (
    [Id] uniqueidentifier NOT NULL,
    [TenantId] uniqueidentifier NULL,
    [ConfigKey] nvarchar(max) NOT NULL,
    [ConfigValue] nvarchar(max) NOT NULL,
    [CreatedUtc] datetime2 NOT NULL,
    [ModifiedUtc] datetime2 NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedUtc] datetime2 NULL,
    CONSTRAINT [PK_SystemConfigurations] PRIMARY KEY ([Id])
);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260912044058_AddSystemConfiguration', N'9.0.0');

ALTER TABLE [Tenants] ADD [Fee] decimal(18,2) NOT NULL DEFAULT 0.0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260912052403_AddFeeToTenant', N'9.0.0');

CREATE TABLE [TenantInvitations] (
    [Id] uniqueidentifier NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [Message] nvarchar(max) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [SentUtc] datetime2 NOT NULL,
    [ClickedUtc] datetime2 NULL,
    [AcceptedUtc] datetime2 NULL,
    [CreatedTenantId] uniqueidentifier NULL,
    [CreatedUtc] datetime2 NOT NULL,
    [ModifiedUtc] datetime2 NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedUtc] datetime2 NULL,
    CONSTRAINT [PK_TenantInvitations] PRIMARY KEY ([Id])
);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260915192803_AddTenantInvitations', N'9.0.0');

ALTER TABLE [TenantInvitations] ADD [LastResentUtc] datetime2 NULL;

ALTER TABLE [TenantInvitations] ADD [ResentCount] int NOT NULL DEFAULT 0;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260915200318_AddTenantInvitationResendFields', N'9.0.0');

COMMIT;
GO

