using System;
using Ams.Domain.Common;

namespace Ams.Domain.Entities;

public class TenantInvitation : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "Sent"; // Sent, Clicked, Accepted
    public DateTime SentUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ClickedUtc { get; set; }
    public DateTime? AcceptedUtc { get; set; }
    public int ResentCount { get; set; } = 0;
    public DateTime? LastResentUtc { get; set; }
    public Guid? CreatedTenantId { get; set; }
}
