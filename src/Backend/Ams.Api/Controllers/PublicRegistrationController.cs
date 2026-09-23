using Ams.Domain.Entities;
using Ams.Domain.Enums;
using Ams.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ams.Api.Controllers;

[ApiController]
[Route("api/public/association-requests")]
public class PublicRegistrationController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PublicRegistrationController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPut("/api/public/invitations/{id}/click")]
    public async Task<IActionResult> ClickInvitation(Guid id)
    {
        var invite = await _context.TenantInvitations.FindAsync(id);
        if (invite != null && invite.Status == "Sent")
        {
            invite.Status = "Clicked";
            invite.ClickedUtc = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
        return Ok();
    }

    [HttpGet("parent-tenant")]
    public async Task<IActionResult> GetParentTenant()
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.LegalName == "Federation of Kerala Associations in North America");
            
        if (tenant == null) return NotFound(new { Message = "Parent tenant not found." });
        
        return Ok(new { tenant.Id, tenant.LegalName, tenant.DisplayName });
    }

    [HttpPost]
    public async Task<IActionResult> SubmitRequest([FromBody] AssociationRequestDto dto)
    {
        var request = new AssociationRequest
        {
            Status = dto.IsDraft ? RequestStatus.Draft : RequestStatus.Submitted,
            SubmittedByEmail = dto.ContactEmail,
            PayloadJson = System.Text.Json.JsonSerializer.Serialize(dto),
            TenantUniqueId = dto.IsDraft ? string.Empty : (dto.ParentTenantId ?? GenerateTenantId())
        };

        _context.AssociationRequests.Add(request);
        await _context.SaveChangesAsync();

        if (dto.IsDraft)
        {
            return Ok(new { Message = "Draft saved successfully.", RequestId = request.Id });
        }

        // In a real app, we would send an acknowledgment email via Azure Service Bus here.

        if (!dto.IsDraft && dto.InviteId.HasValue)
        {
            var invite = await _context.TenantInvitations.FindAsync(dto.InviteId.Value);
            if (invite != null)
            {
                invite.Status = "Accepted";
                invite.AcceptedUtc = DateTime.UtcNow;
                // If the tenant isn't created yet, we can't link it. Wait, the association request isn't a tenant yet. 
                // But we know they accepted.
                await _context.SaveChangesAsync();
            }
        }

        return Ok(new { Message = "Request submitted successfully. You will receive an email shortly.", RequestId = request.Id, TenantId = request.TenantUniqueId });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateRequest(Guid id, [FromBody] AssociationRequestDto dto)
    {
        var request = await _context.AssociationRequests.FindAsync(id);
        if (request == null) return NotFound();

        request.Status = dto.IsDraft ? RequestStatus.Draft : RequestStatus.Submitted;
        request.SubmittedByEmail = dto.ContactEmail;
        request.PayloadJson = System.Text.Json.JsonSerializer.Serialize(dto);

        if (!dto.IsDraft && string.IsNullOrEmpty(request.TenantUniqueId))
        {
            request.TenantUniqueId = dto.ParentTenantId ?? GenerateTenantId();
        }

        await _context.SaveChangesAsync();

        if (dto.IsDraft)
        {
            return Ok(new { Message = "Draft updated successfully.", RequestId = request.Id });
        }

        return Ok(new { Message = "Request submitted successfully. You will receive an email shortly.", RequestId = request.Id, TenantId = request.TenantUniqueId });
    }

    private string GenerateTenantId()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var idString = new string(Enumerable.Repeat(chars, 8).Select(s => s[Random.Shared.Next(s.Length)]).ToArray());
        return $"TENANT-{idString}";
    }
}

public class AssociationRequestDto
{
    public bool IsDraft { get; set; }
    public string? ParentTenantId { get; set; }
    public Guid? InviteId { get; set; }
    
    // Part 1: Organization Details
    public string AssociationName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Country { get; set; } = "United States"; // Default per fallback rule
    public string Zip { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string WebAddress { get; set; } = string.Empty;
    
    public int? NumberOfPaidMembers { get; set; }
    public int? YearFormed { get; set; }
    public string MonthOfAnnualElection { get; set; } = string.Empty;
    public DateTime? DateOfStateRegistration { get; set; }
    
    // Original Fields (kept for internal routing)
    public AssociationType Type { get; set; }
    public string StateOfIncorporation { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    
    // Part 7: Executive Committee
    public ExecutiveCommitteeDto ExecutiveCommittee { get; set; } = new();
    
    // Part: Board of Directors and Representatives
    public BoardOfDirectorsDto BoardOfDirectors { get; set; } = new();
}

public class ExecutiveCommitteeDto
{
    public DateTime? DateOfElection { get; set; }
    public DateTime? DateOfTermEnding { get; set; }
    
    public CommitteeMemberDto President { get; set; } = new();
    public CommitteeMemberDto Secretary { get; set; } = new();
    public CommitteeMemberDto Treasurer { get; set; } = new();
    public CommitteeMemberDto CommitteeMember1 { get; set; } = new();
    public CommitteeMemberDto CommitteeMember2 { get; set; } = new();
    public CommitteeMemberDto CommitteeMember3 { get; set; } = new();
    public CommitteeMemberDto CommitteeMember4 { get; set; } = new();
    public CommitteeMemberDto CommitteeMember5 { get; set; } = new();
}

public class CommitteeMemberDto
{
    public string Name { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
}

public class BoardOfDirectorsDto
{
    public RepresentativeDto CurrentPresident { get; set; } = new();
    public PastBearerDto PastPresident { get; set; } = new();
    public PastBearerDto PastSecretary { get; set; } = new();
    public PastBearerDto PastTreasurer { get; set; } = new();
}

public class PastBearerDto
{
    public string Name { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class RepresentativeDto
{
    public string Name { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Zip { get; set; } = string.Empty;
    public string TelephoneAndEmail { get; set; } = string.Empty;
}
