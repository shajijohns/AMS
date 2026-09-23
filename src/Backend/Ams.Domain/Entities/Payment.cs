using Ams.Domain.Common;

namespace Ams.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    public Guid InvoiceId { get; set; }
    
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    
    // e.g. Stripe Charge ID
    public string GatewayTransactionId { get; set; } = string.Empty;
    public bool IsSuccessful { get; set; }
}
