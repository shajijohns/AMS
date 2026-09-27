using Ams.Domain.Entities;
using Ams.Domain.Enums;
using Ams.Infrastructure.Persistence;
using Azure.Communication.Email;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Ams.Api.Controllers;

[ApiController]
[Route("api/public/association-requests")]
public class PublicRegistrationController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public PublicRegistrationController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
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

        if (dto.IsDraft)
        {
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Draft saved successfully.", RequestId = request.Id });
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            await _context.SaveChangesAsync();

            if (dto.InviteId.HasValue)
            {
                var invite = await _context.TenantInvitations.FindAsync(dto.InviteId.Value);
                if (invite != null)
                {
                    invite.Status = "Accepted";
                    invite.AcceptedUtc = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }

            await SendConfirmationEmailAsync(dto.ContactEmail, dto.AssociationName);

            await transaction.CommitAsync();
            return Ok(new { Message = "Request submitted successfully. You will receive an email shortly.", RequestId = request.Id, TenantId = request.TenantUniqueId });
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { Message = "Failed to send confirmation email. Your submission was not completed. Please try again." });
        }
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

        if (dto.IsDraft)
        {
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Draft updated successfully.", RequestId = request.Id });
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            await _context.SaveChangesAsync();

            await SendConfirmationEmailAsync(dto.ContactEmail, dto.AssociationName);

            await transaction.CommitAsync();
            return Ok(new { Message = "Request submitted successfully. You will receive an email shortly.", RequestId = request.Id, TenantId = request.TenantUniqueId });
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { Message = "Failed to send confirmation email. Your submission was not completed. Please try again." });
        }
    }

    private async Task SendConfirmationEmailAsync(string contactEmail, string associationName)
    {
        var connectionString = _configuration["AzureEmail:ConnectionString"];
        var senderAddress = _configuration["AzureEmail:SenderAddress"];
        var adminRecipients = _configuration["AzureEmail:AdminRecipients"];
        
        if (string.IsNullOrEmpty(connectionString) || string.IsNullOrEmpty(senderAddress))
        {
            throw new Exception("Email configuration is missing.");
        }

        var emailClient = new EmailClient(connectionString);
        var content = new EmailContent("Registration Received")
        {
            PlainText = $"Hello,\n\nYour registration request for {associationName} has been successfully received.\n\nThank you.",
            Html = $"<p>Hello,</p><p>Your registration request for <b>{associationName}</b> has been successfully received.</p><p>Thank you.</p>"
        };
        
        var recipients = new EmailRecipients(new List<EmailAddress> { new EmailAddress(contactEmail) });
        
        if (!string.IsNullOrEmpty(adminRecipients))
        {
            var adminEmails = adminRecipients.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var adminEmail in adminEmails)
            {
                recipients.BCC.Add(new EmailAddress(adminEmail.Trim()));
            }
        }

        var message = new EmailMessage(senderAddress, recipients, content);
        
        await emailClient.SendAsync(Azure.WaitUntil.Completed, message);
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadDocument(IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "uploads");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new { Path = uniqueFileName, Name = file.FileName });
    }

    [HttpDelete("upload/{fileName}")]
    public IActionResult DeleteDocument(string fileName)
    {
        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "uploads", fileName);
        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
        }
        return Ok();
    }

    [HttpGet("document/{fileName}")]
    public IActionResult GetDocument(string fileName)
    {
        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "uploads", fileName);
        if (!System.IO.File.Exists(filePath)) return NotFound();
        return PhysicalFile(filePath, "application/octet-stream", fileName);
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

    public List<DocumentDto> Documents { get; set; } = new();
}

public class DocumentDto
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
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
