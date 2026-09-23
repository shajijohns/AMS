using Ams.Domain.Entities;
using Ams.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace Ams.Api.Controllers;

public class InviteAssociationDto
{
    public string Email { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<IFormFile> Attachments { get; set; } = new();
}

[Authorize]
[ApiController]
[Route("api/admin/associations")]
public class AdminAssociationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminAssociationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAssociations()
    {
        var requests = await _context.AssociationRequests
            .Where(r => r.Status == Ams.Domain.Enums.RequestStatus.Approved)
            .OrderByDescending(t => t.CreatedUtc)
            .ToListAsync();

        var associations = requests.Select(r => 
        {
            var payload = System.Text.Json.JsonSerializer.Deserialize<AssociationRequestDto>(r.PayloadJson);
            return new
            {
                Id = r.TenantUniqueId,
                LegalName = payload?.AssociationName ?? "Unknown",
                DisplayName = payload?.AssociationName ?? "Unknown",
                Type = payload?.Type.ToString() ?? "Unknown",
                Status = "Active",
                StateRegNumber = "",
                StateRegDate = payload?.DateOfStateRegistration,
                StateOfIncorporation = payload?.StateOfIncorporation ?? "Unknown",
                CreatedUtc = r.CreatedUtc
            };
        });

        return Ok(associations);
    }

    [HttpPost("invite")]
    public async Task<IActionResult> InviteAssociation([FromForm] InviteAssociationDto dto)
    {
        // Read global configuration
        var configList = await _context.SystemConfigurations
            .Where(c => c.TenantId == null)
            .ToListAsync();
        var configs = configList.ToDictionary(c => c.ConfigKey, c => c.ConfigValue);

        var provider = configs.GetValueOrDefault("EmailProvider", "smtp");

        // Simulate sending an invitation email
        Console.WriteLine($"\n========================================================");
        Console.WriteLine($"[EMAIL SYSTEM SIMULATION]");
        Console.WriteLine($"Provider: {(provider == "azure" ? "Azure Mail Service" : "Hosting SMTP")}");
        
        if (provider == "smtp")
        {
            Console.WriteLine($"SMTP Server: {configs.GetValueOrDefault("SmtpServer", "Not Configured")}");
            Console.WriteLine($"SMTP User: {configs.GetValueOrDefault("SmtpUserId", "Not Configured")}");
        }
        else if (provider == "azure")
        {
            Console.WriteLine($"Azure Connection String: {configs.GetValueOrDefault("AzureConnectionString", "Not Configured")}");
            Console.WriteLine($"Azure Sender Email: {configs.GetValueOrDefault("AzureSenderEmail", "Not Configured")}");
        }

        Console.WriteLine($"To: {dto.Email}");
        Console.WriteLine($"Subject: Invitation to Register Your Association");
        Console.WriteLine($"Body: Please register your association by clicking the following link: http://localhost:5173/register");
        if (!string.IsNullOrEmpty(dto.Message))
        {
            Console.WriteLine($"\nPersonalized Message (HTML):\n{dto.Message}");
        }
        if (dto.Attachments != null && dto.Attachments.Count > 0)
        {
            Console.WriteLine($"\nAttachments ({dto.Attachments.Count}):");
            foreach (var file in dto.Attachments)
            {
                Console.WriteLine($"  - {file.FileName} ({file.Length} bytes)");
            }
        }
        Console.WriteLine($"========================================================\n");

        return Ok(new { Message = "Invitation sent successfully." });
    }
}
