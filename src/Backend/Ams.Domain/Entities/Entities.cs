using Ams.Domain.Common;
using Ams.Domain.Enums;

namespace Ams.Domain.Entities;

public class AssociationRequest : BaseEntity
{
    public RequestStatus Status { get; set; } = RequestStatus.Submitted;
    
    // Core payload - could be normalized, but using JSON allows flexibility in request forms
    public string PayloadJson { get; set; } = string.Empty;
    public string SubmittedByEmail { get; set; } = string.Empty;
    
    public string? ReviewerNotes { get; set; }
    public DateTime? DecisionUtc { get; set; }
    public Guid? DecidedByUserId { get; set; }
    
    public string? SecureOnboardingToken { get; set; }
    public DateTime? TokenExpiresUtc { get; set; }
    
    public string TenantUniqueId { get; set; } = string.Empty;
}

public class Officer : BaseEntity
{
    // Bound to a specific Tenant
    public Guid TenantId { get; set; }
    
    public string Title { get; set; } = string.Empty; // e.g. President, Secretary
    public string Name { get; set; } = string.Empty;
    
    // Encrypted PII
    public string Email_Encrypted { get; set; } = string.Empty;
    public string Phone_Encrypted { get; set; } = string.Empty;
    
    public DateTime? TermStart { get; set; }
    public DateTime? TermEnd { get; set; }
    public DateTime? ElectionDate { get; set; }
}
