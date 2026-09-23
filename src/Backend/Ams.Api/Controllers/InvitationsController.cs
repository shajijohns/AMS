using Ams.Domain.Entities;
using Ams.Domain.Enums;
using Ams.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ams.Api.Controllers;

[ApiController]
[Route("api/invitations")]
public class InvitationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public InvitationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("{token}/validate")]
    public async Task<IActionResult> ValidateToken(string token)
    {
        var invitation = await _context.Invitations.FirstOrDefaultAsync(i => i.TokenHash == token);
        if (invitation == null) return NotFound("Invalid token.");
        if (invitation.UsedUtc != null) return BadRequest("Token already used.");
        if (invitation.ExpiresUtc < DateTime.UtcNow) return BadRequest("Token expired.");

        var member = await _context.Members.FindAsync(invitation.MemberId);
        return Ok(new { valid = true, email = member?.Email_Encrypted.Replace("ENCRYPTED_", "") });
    }

    [HttpPost("{token}/accept")]
    public async Task<IActionResult> AcceptInvitation(string token, [FromBody] AcceptInvitationDto dto)
    {
        var invitation = await _context.Invitations.FirstOrDefaultAsync(i => i.TokenHash == token);
        if (invitation == null || invitation.UsedUtc != null || invitation.ExpiresUtc < DateTime.UtcNow)
        {
            return BadRequest("Invalid or expired token.");
        }

        var member = await _context.Members.FindAsync(invitation.MemberId);
        if (member == null) return NotFound("Member record not found.");

        // Here we would normally create the ASP.NET Core Identity user, hash the password, 
        // and link the new UserId to the member.UserId. 
        // For demonstration, we simulate that.
        var newUserId = Guid.NewGuid();
        member.UserId = newUserId;
        member.Status = MembershipStatus.Registered;

        // Update Member profile
        member.DOB_Encrypted = "ENCRYPTED_" + dto.DOB;
        member.Phone_Encrypted = "ENCRYPTED_" + dto.Phone;
        member.AddressJson_Encrypted = "ENCRYPTED_" + System.Text.Json.JsonSerializer.Serialize(dto.Address);

        // Add Family Members
        foreach (var fm in dto.FamilyMembers)
        {
            _context.FamilyMembers.Add(new FamilyMember
            {
                MemberId = member.Id,
                Name = fm.Name,
                Relationship = fm.Relationship,
                DOB_Encrypted = "ENCRYPTED_" + fm.DOB
            });
        }

        // Add Consents
        _context.ConsentRecords.Add(new ConsentRecord { UserId = newUserId, TenantId = member.TenantId, ConsentType = ConsentType.PrivacyPolicy, Version = "1.0" });
        _context.ConsentRecords.Add(new ConsentRecord { UserId = newUserId, TenantId = member.TenantId, ConsentType = ConsentType.DataProcessing, Version = "1.0" });
        if (dto.Consents.Marketing) 
            _context.ConsentRecords.Add(new ConsentRecord { UserId = newUserId, TenantId = member.TenantId, ConsentType = ConsentType.Marketing, Version = "1.0" });
        if (dto.Consents.DirectoryVisibility) 
            _context.ConsentRecords.Add(new ConsentRecord { UserId = newUserId, TenantId = member.TenantId, ConsentType = ConsentType.DirectoryVisibility, Version = "1.0" });

        invitation.UsedUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { Message = "Registration completed successfully.", UserId = newUserId });
    }
}

public class AcceptInvitationDto
{
    public string Password { get; set; } = string.Empty; // Would be processed by Identity UserManager
    public string DOB { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public AddressDto Address { get; set; } = new();
    public List<FamilyMemberDto> FamilyMembers { get; set; } = new();
    public ConsentsDto Consents { get; set; } = new();
}

public class AddressDto
{
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Zip { get; set; } = string.Empty;
}

public class FamilyMemberDto
{
    public string Name { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public string DOB { get; set; } = string.Empty;
}

public class ConsentsDto
{
    public bool PrivacyPolicy { get; set; } = true;
    public bool DataProcessing { get; set; } = true;
    public bool Marketing { get; set; }
    public bool DirectoryVisibility { get; set; }
}
