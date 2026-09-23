using Ams.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Ams.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ComplianceController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ComplianceController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("export/{memberId}")]
    public async Task<IActionResult> ExportMemberData(Guid memberId)
    {
        var member = await _context.Members
            .FirstOrDefaultAsync(m => m.Id == memberId);

        if (member == null)
            return NotFound(new { Message = "Member not found" });

        var familyMembers = await _context.FamilyMembers
            .Where(f => f.MemberId == memberId)
            .ToListAsync();

        var consents = await _context.ConsentRecords
            .Where(c => member.UserId != null && c.UserId == member.UserId)
            .ToListAsync();

        var invoices = await _context.Invoices
            .Where(i => i.MemberId == memberId)
            .ToListAsync();

        var payments = await _context.Payments
            .Where(p => invoices.Select(inv => inv.Id).Contains(p.InvoiceId))
            .ToListAsync();

        var exportData = new
        {
            Member = member,
            FamilyMembers = familyMembers,
            Consents = consents,
            Invoices = invoices,
            Payments = payments
        };

        return File(
            System.Text.Encoding.UTF8.GetBytes(JsonSerializer.Serialize(exportData)),
            "application/json",
            $"member_{memberId}_export.json"
        );
    }
}
