using Ams.Domain.Entities;
using Ams.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ams.Api.Controllers;

[ApiController]
[Route("api/me/profile")]
// [Authorize]
public class ProfileController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProfileController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile([FromQuery] Guid mockUserId)
    {
        // In reality, this would be User.FindFirstValue(ClaimTypes.NameIdentifier)
        var userId = mockUserId; 
        
        var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);
        if (member == null) return NotFound();

        var family = await _context.FamilyMembers.Where(f => f.MemberId == member.Id).ToListAsync();

        return Ok(new
        {
            Profile = new
            {
                member.FirstName,
                member.LastName,
                member.MemberNumber,
                member.MembershipType,
                member.Status,
                Email = member.Email_Encrypted.Replace("ENCRYPTED_", ""),
                Phone = member.Phone_Encrypted?.Replace("ENCRYPTED_", "")
            },
            Family = family.Select(f => new
            {
                f.Name,
                f.Relationship,
                DOB = f.DOB_Encrypted?.Replace("ENCRYPTED_", "")
            })
        });
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromQuery] Guid mockUserId, [FromBody] UpdateProfileDto dto)
    {
        var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == mockUserId);
        if (member == null) return NotFound();

        member.Phone_Encrypted = "ENCRYPTED_" + dto.Phone;
        // Apply other editable fields...

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Profile updated." });
    }
}

public class UpdateProfileDto
{
    public string Phone { get; set; } = string.Empty;
}
