using Ams.Domain.Entities;
using Ams.Domain.Enums;
using Ams.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ams.Api.Controllers;

[ApiController]
[Route("api/billing")]
public class BillingController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BillingController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices([FromQuery] Guid mockUserId)
    {
        var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == mockUserId);
        if (member == null) return NotFound("Member not found.");

        var invoices = await _context.Invoices
            .Where(i => i.MemberId == member.Id)
            .OrderByDescending(i => i.IssueDate)
            .ToListAsync();

        return Ok(invoices);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetPaymentHistory([FromQuery] Guid mockUserId)
    {
        var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == mockUserId);
        if (member == null) return NotFound("Member not found.");

        var payments = await _context.Payments
            .Where(p => p.MemberId == member.Id)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        return Ok(payments);
    }

    [HttpPost("seed-mock")]
    public async Task<IActionResult> SeedMockInvoice([FromQuery] Guid mockUserId)
    {
        var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == mockUserId);
        if (member == null) return NotFound("Member not found.");

        var invoice = new Invoice
        {
            TenantId = member.TenantId,
            MemberId = member.Id,
            InvoiceNumber = "INV-" + DateTime.UtcNow.Ticks.ToString().Substring(10),
            Description = "Annual Membership Dues 2027",
            AmountDue = 150.00m,
            AmountPaid = 0.00m,
            Status = InvoiceStatus.Open,
            IssueDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(30)
        };

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Mock invoice created.", Invoice = invoice });
    }
}
