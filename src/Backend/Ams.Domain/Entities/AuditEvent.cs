namespace Ams.Domain.Entities;

public class AuditEvent
{
    public Guid AuditId { get; set; } = Guid.NewGuid();
    public DateTime OccurredUtc { get; set; } = DateTime.UtcNow;
    public Guid? ActorUserId { get; set; }
    public string? ActorRole { get; set; }
    public Guid? TenantId { get; set; }
    
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    
    public string? BeforeJson { get; set; }
    public string? AfterJson { get; set; }
    public string? IpAddress { get; set; }
    public string? CorrelationId { get; set; }
}
