using Ams.Domain.Common;
using Ams.Domain.Enums;

namespace Ams.Domain.Entities;

public class PaymentMethod : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    
    public PaymentMethodType Type { get; set; }
    
    public string GatewayToken { get; set; } = string.Empty; // e.g. Stripe Customer/Card ID
    public string Last4 { get; set; } = string.Empty;
    public string ExpiryMonth { get; set; } = string.Empty;
    public string ExpiryYear { get; set; } = string.Empty;
    
    public bool IsDefault { get; set; }
}
