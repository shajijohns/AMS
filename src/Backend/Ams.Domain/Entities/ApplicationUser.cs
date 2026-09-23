using Microsoft.AspNetCore.Identity;

namespace Ams.Domain.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    // A user can be part of a tenant or a global admin
    public Guid? TenantId { get; set; }
    
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    
    // For soft delete and audits
    public bool IsDeleted { get; set; }
    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
}
