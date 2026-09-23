using Ams.Domain.Common;

namespace Ams.Domain.Entities;

public class SystemConfiguration : BaseEntity
{
    public Guid? TenantId { get; set; } // Null implies global system setting
    public string ConfigKey { get; set; } = string.Empty;
    public string ConfigValue { get; set; } = string.Empty;
}
