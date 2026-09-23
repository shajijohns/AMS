namespace Ams.Domain.Enums;

public enum RequestStatus
{
    Submitted = 0,
    UnderReview = 1,
    MoreInfoRequested = 2,
    Approved = 3,
    Rejected = 4,
    Draft = 5
}

public enum AssociationType
{
    Cultural,
    Club,
    Nonprofit,
    Federation
}

public enum MembershipStatus
{
    Invited,
    Registered,
    PendingPayment,
    Active,
    Lapsed
}

public enum ConsentType
{
    PrivacyPolicy,
    DataProcessing,
    Marketing,
    DirectoryVisibility
}

public enum InvoiceStatus
{
    Draft,
    Open,
    Paid,
    Void,
    Overdue
}

public enum PaymentMethodType
{
    CreditCard,
    BankAccount,
    Offline
}
