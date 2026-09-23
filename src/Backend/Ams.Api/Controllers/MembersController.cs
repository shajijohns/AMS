using Ams.Domain.Entities;
using Ams.Domain.Enums;
using Ams.Infrastructure.Persistence;
using Ams.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ams.Api.Controllers;

[ApiController]
[Route("api/members")]
// [Authorize(Roles = "AssociationAdmin")]
public class MembersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public MembersController(ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<IActionResult> GetMembers()
    {
        var members = await _context.Members.OrderBy(m => m.LastName).ToListAsync();
        return Ok(members);
    }

    [HttpPost]
    public async Task<IActionResult> SeedMember([FromBody] SeedMemberDto dto)
    {
        var tenantId = _tenantProvider.GetCurrentTenantId() ?? Guid.Parse("00000000-0000-0000-0000-000000000001"); // Mock tenant for testing

        var member = new Member
        {
            TenantId = tenantId,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email_Encrypted = "ENCRYPTED_" + dto.Email,
            MembershipType = dto.MembershipType,
            MemberNumber = "M" + DateTime.UtcNow.Ticks.ToString().Substring(10), // Simple auto-generate
            Status = MembershipStatus.Invited
        };

        _context.Members.Add(member);

        var invitation = new Invitation
        {
            TenantId = tenantId,
            MemberId = member.Id,
            TokenHash = Guid.NewGuid().ToString("N"), // In reality, hash a strong random token
            ExpiresUtc = DateTime.UtcNow.AddDays(7)
        };

        _context.Invitations.Add(invitation);
        
        await _context.SaveChangesAsync();

        // In a real app, send an email with the invitation link here.

        return Ok(new { 
            Message = "Member seeded and invited.", 
            MemberId = member.Id, 
            InvitationLink = $"http://localhost:5173/invite/{invitation.TokenHash}" // Mock link for testing
        });
    }

    [HttpPost("{id:guid}/resend-invite")]
    public async Task<IActionResult> ResendInvite(Guid id)
    {
        var invitation = await _context.Invitations.FirstOrDefaultAsync(i => i.MemberId == id && i.UsedUtc == null);
        if (invitation == null) return NotFound("No active invitation found.");

        invitation.ResentCount++;
        invitation.ExpiresUtc = DateTime.UtcNow.AddDays(7); // Extend expiry
        
        await _context.SaveChangesAsync();
        // Send email...

        return Ok(new { Message = "Invitation resent." });
    }
}

public class SeedMemberDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string MembershipType { get; set; } = "Individual";
}
