using Ams.Domain.Entities;
using Ams.Domain.Enums;
using Ams.Infrastructure.Persistence;
using Ams.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ams.Api.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IPaymentGatewayService _paymentGateway;

    public PaymentsController(ApplicationDbContext context, IPaymentGatewayService paymentGateway)
    {
        _context = context;
        _paymentGateway = paymentGateway;
    }

    [HttpPost("process")]
    public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentDto dto)
    {
        var invoice = await _context.Invoices.FindAsync(dto.InvoiceId);
        if (invoice == null) return NotFound("Invoice not found.");
        if (invoice.Status == InvoiceStatus.Paid) return BadRequest("Invoice is already paid.");

        // Simulate processing payment via Gateway
        var result = await _paymentGateway.ProcessPaymentAsync(invoice.AmountDue, invoice.Currency, dto.CardToken);

        var payment = new Payment
        {
            TenantId = invoice.TenantId,
            MemberId = invoice.MemberId,
            InvoiceId = invoice.Id,
            Amount = invoice.AmountDue,
            PaymentDate = DateTime.UtcNow,
            GatewayTransactionId = result.TransactionId,
            IsSuccessful = result.Success
        };

        _context.Payments.Add(payment);

        if (result.Success)
        {
            invoice.AmountPaid = invoice.AmountDue;
            invoice.Status = InvoiceStatus.Paid;
        }

        await _context.SaveChangesAsync();

        if (!result.Success)
        {
            return BadRequest(new { Message = result.ErrorMessage ?? "Payment failed." });
        }

        return Ok(new { Message = "Payment successful.", TransactionId = result.TransactionId });
    }
}

public class ProcessPaymentDto
{
    public Guid InvoiceId { get; set; }
    public string CardToken { get; set; } = string.Empty; // Mock card token or data
}
