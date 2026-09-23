using Ams.Domain.Common;

namespace Ams.Domain.Entities;

public class Invitation : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    
    public string TokenHash { get; set; } = string.Empty; // Store hashed for security
    public DateTime ExpiresUtc { get; set; }
    public DateTime? UsedUtc { get; set; }
    public int ResentCount { get; set; } = 0;
}
