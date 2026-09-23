using Ams.Domain.Common;
using Ams.Domain.Enums;

namespace Ams.Domain.Entities;

public class ConsentRecord : BaseEntity
{
    public Guid UserId { get; set; } // The identity user who gave consent
    public Guid TenantId { get; set; } // Consents are often tenant-scoped (e.g. association directory)
    
    public ConsentType ConsentType { get; set; }
    public string Version { get; set; } = "1.0"; // Version of the policy agreed to
    
    public DateTime GrantedUtc { get; set; } = DateTime.UtcNow;
    public DateTime? RevokedUtc { get; set; }
    
    public string? IpAddress { get; set; }
}
