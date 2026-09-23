using Ams.Domain.Common;

namespace Ams.Domain.Entities;

public class FamilyMember : BaseEntity
{
    public Guid MemberId { get; set; }
    
    public string Relationship { get; set; } = string.Empty; // Spouse, Child, Dependent
    public string Name { get; set; } = string.Empty;
    public string? DOB_Encrypted { get; set; }
}
