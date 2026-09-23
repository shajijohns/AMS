using Ams.Domain.Entities;
using Ams.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ams.Api.Controllers;

[ApiController]
[Route("api/onboarding")]
public class OnboardingController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public OnboardingController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("{token}/complete")]
    public async Task<IActionResult> CompleteOnboarding(string token, [FromBody] OnboardingDto dto)
    {
        var request = await _context.AssociationRequests
            .FirstOrDefaultAsync(r => r.SecureOnboardingToken == token);

        if (request == null) return NotFound("Invalid onboarding token.");
        if (request.TokenExpiresUtc < DateTime.UtcNow) return BadRequest("Onboarding token expired.");

        // In a real scenario, the tenant record would be linked to this request or we would fetch it.
        // For simplicity, we just find the pending tenant.
        var tenant = await _context.Tenants.OrderByDescending(t => t.CreatedUtc).FirstOrDefaultAsync(t => t.Status == "PendingOnboarding");
        
        if (tenant == null) return NotFound("Tenant record not found.");

        tenant.Status = "Active";
        tenant.LegalName = dto.LegalName;
        tenant.StateRegNumber = dto.StateRegNumber;
        tenant.StateOfIncorporation = dto.StateOfIncorporation;
        // Encrypt EIN before saving
        tenant.EIN_Encrypted = "ENCRYPTED_" + dto.EIN; 

        // Create Officers
        foreach (var officerDto in dto.Officers)
        {
            _context.Officers.Add(new Officer
            {
                TenantId = tenant.Id,
                Title = officerDto.Title,
                Name = officerDto.Name,
                Email_Encrypted = "ENCRYPTED_" + officerDto.Email,
                Phone_Encrypted = "ENCRYPTED_" + officerDto.Phone
            });
        }

        // Clear token
        request.SecureOnboardingToken = null;
        
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Onboarding completed. Association is now Active." });
    }
}

public class OnboardingDto
{
    public string LegalName { get; set; } = string.Empty;
    public string EIN { get; set; } = string.Empty;
    public string StateRegNumber { get; set; } = string.Empty;
    public string StateOfIncorporation { get; set; } = string.Empty;
    public List<OfficerDto> Officers { get; set; } = new();
}

public class OfficerDto
{
    public string Title { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}
