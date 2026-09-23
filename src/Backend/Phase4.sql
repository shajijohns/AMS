BEGIN TRANSACTION;
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

COMMIT;
GO

