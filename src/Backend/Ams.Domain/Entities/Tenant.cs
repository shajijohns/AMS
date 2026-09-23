using Ams.Domain.Common;

namespace Ams.Domain.Entities;

public class Tenant : BaseEntity
{
    public string LegalName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = "PendingOnboarding";
    public decimal Fee { get; set; }
    
    
    // Encrypted fields (will be configured in DbContext or handled via interceptors/value converters)
    public string EIN_Encrypted { get; set; } = string.Empty;
    
    public string StateRegNumber { get; set; } = string.Empty;
    public DateTime? StateRegDate { get; set; }
    public string StateOfIncorporation { get; set; } = string.Empty;
}
