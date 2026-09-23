using Ams.Domain.Common;
using Ams.Domain.Enums;

namespace Ams.Domain.Entities;

public class Invoice : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid MemberId { get; set; }
    
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    public decimal AmountDue { get; set; }
    public decimal AmountPaid { get; set; }
    public string Currency { get; set; } = "USD";
    
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
}
