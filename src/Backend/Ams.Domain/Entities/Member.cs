using Ams.Domain.Common;
using Ams.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace Ams.Domain.Entities;

public class Member : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid? UserId { get; set; } // Null until they register
    
    public string MemberNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    
    // Encrypted PII
    public string? DOB_Encrypted { get; set; }
    public string Email_Encrypted { get; set; } = string.Empty;
    public string? Phone_Encrypted { get; set; }
    public string? AddressJson_Encrypted { get; set; }
    
    public string MembershipType { get; set; } = "Individual"; // Individual, Family, Life, etc.
    public MembershipStatus Status { get; set; } = MembershipStatus.Invited;
    
    public DateTime? JoinDate { get; set; }
    public DateTime? ValidThrough { get; set; }
    
    [Timestamp]
    public byte[]? RowVersion { get; set; }
}
