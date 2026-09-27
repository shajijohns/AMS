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

            await SendConfirmationEmailAsync(dto);

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

            await SendConfirmationEmailAsync(dto);

            await transaction.CommitAsync();
            return Ok(new { Message = "Request submitted successfully. You will receive an email shortly.", RequestId = request.Id, TenantId = request.TenantUniqueId });
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { Message = "Failed to send confirmation email. Your submission was not completed. Please try again." });
        }
    }

    private async Task SendConfirmationEmailAsync(AssociationRequestDto dto)
    {
        var connectionString = _configuration["AzureEmail:ConnectionString"];
        var senderAddress = _configuration["AzureEmail:SenderAddress"];
        var adminRecipients = _configuration["AzureEmail:AdminRecipients"];
        
        if (string.IsNullOrEmpty(connectionString) || string.IsNullOrEmpty(senderAddress))
        {
            throw new Exception("Email configuration is missing.");
        }

        var htmlBuilder = new System.Text.StringBuilder();
        htmlBuilder.Append($@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
</head>
<body style=""margin: 0; padding: 30px; background-color: #f0f4f8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center;"">
    <table align=""center"" cellpadding=""0"" cellspacing=""0"" border=""0"" width=""100%"" style=""max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); text-align: left;"">
        <tr>
            <td style=""background: linear-gradient(135deg, #312e81, #4338ca); background-color: #312e81; padding: 35px; color: #ffffff;"">
                <div style=""font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; color: #a5b4fc;"">Federation Membership Portal</div>
                <h2 style=""margin: 0; font-size: 28px; font-weight: 700; margin-bottom: 15px; color: #ffffff;"">New Membership Application</h2>
                <div style=""font-size: 15px; color: #e0e7ff; margin-bottom: 20px;"">A completed membership application has been submitted for administrative review.</div>
                <span style=""display: inline-block; background-color: #10b981; color: #ffffff; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;"">✓ Application Received</span>
            </td>
        </tr>
        <tr>
            <td style=""padding: 30px;"">
                <div style=""background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 18px 24px; border-radius: 0 8px 8px 0; color: #1e3a8a; font-size: 15px; line-height: 1.6; margin-bottom: 30px;"">
                    <strong>Administrator Review Required</strong><br/>
                    Please review the organization information, executive committee, board details, and all attached supporting documents below.
                </div>

                <!-- 01 Organization Details -->
                <div style=""border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 30px;"">
                    <div style=""background-color: #f8fafc; padding: 15px 20px; border-bottom: 1px solid #e2e8f0; display: table; width: 100%;"">
                        <div style=""display: table-cell; vertical-align: middle; width: 35px;"">
                            <div style=""background-color: #6366f1; color: #ffffff; width: 26px; height: 26px; border-radius: 13px; text-align: center; line-height: 26px; font-size: 12px; font-weight: bold;"">01</div>
                        </div>
                        <div style=""display: table-cell; vertical-align: middle;"">
                            <h3 style=""margin: 0; font-size: 17px; font-weight: 600; color: #0f172a;"">Organization Details</h3>
                        </div>
                    </div>
                    <table width=""100%"" cellpadding=""15"" cellspacing=""0"" border=""0"" style=""font-size: 14px; color: #334155;"">
                        <tr><td width=""35%"" style=""font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #f1f5f9;"">Organization Name</td><td style=""border-bottom: 1px solid #f1f5f9;""><strong>{dto.AssociationName}</strong></td></tr>
                        <tr><td style=""font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #f1f5f9;"">Year Established</td><td style=""border-bottom: 1px solid #f1f5f9;"">{dto.YearFormed}</td></tr>
                        <tr><td style=""font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #f1f5f9;"">Address</td><td style=""border-bottom: 1px solid #f1f5f9;"">{dto.Address}, {dto.City}, {dto.State} {dto.Zip}</td></tr>
                        <tr><td style=""font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #f1f5f9;"">Country</td><td style=""border-bottom: 1px solid #f1f5f9;"">{dto.Country}</td></tr>
                        <tr><td style=""font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #f1f5f9;"">Website</td><td style=""border-bottom: 1px solid #f1f5f9;"">{dto.WebAddress}</td></tr>
                        <tr><td style=""font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #f1f5f9;"">Primary Contact</td><td style=""border-bottom: 1px solid #f1f5f9;""><a href=""mailto:{dto.ContactEmail}"" style=""color: #4f46e5;"">{dto.ContactEmail}</a> - {dto.Telephone}</td></tr>
                        <tr><td style=""font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #f1f5f9;"">Paid Members</td><td style=""border-bottom: 1px solid #f1f5f9;"">{dto.NumberOfPaidMembers}</td></tr>
                        <tr><td style=""font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #f1f5f9;"">State Registration</td><td style=""border-bottom: 1px solid #f1f5f9;"">{(dto.DateOfStateRegistration?.ToString("MM/dd/yyyy") ?? "N/A")}</td></tr>
                        <tr><td style=""font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #f1f5f9;"">Election Month</td><td style=""border-bottom: 1px solid #f1f5f9;"">{dto.MonthOfAnnualElection}</td></tr>
                        <tr><td style=""font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px;"">Committee Term</td><td>{(dto.ExecutiveCommittee.DateOfElection?.ToString("MM/dd/yyyy") ?? "N/A")} to {(dto.ExecutiveCommittee.DateOfTermEnding?.ToString("MM/dd/yyyy") ?? "N/A")}</td></tr>
                    </table>
                </div>
                
                <!-- 02 Executive Committee -->
                <div style=""border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 30px;"">
                    <div style=""background-color: #f8fafc; padding: 15px 20px; border-bottom: 1px solid #e2e8f0; display: table; width: 100%;"">
                        <div style=""display: table-cell; vertical-align: middle; width: 35px;"">
                            <div style=""background-color: #6366f1; color: #ffffff; width: 26px; height: 26px; border-radius: 13px; text-align: center; line-height: 26px; font-size: 12px; font-weight: bold;"">02</div>
                        </div>
                        <div style=""display: table-cell; vertical-align: middle;"">
                            <h3 style=""margin: 0; font-size: 17px; font-weight: 600; color: #0f172a;"">Current Executive Committee</h3>
                        </div>
                    </div>
");

        void RenderMemberModern(string role, CommitteeMemberDto m)
        {
            if (!string.IsNullOrEmpty(m.Name))
            {
                htmlBuilder.Append($@"
                    <div style=""padding: 15px 20px; border-bottom: 1px solid #f1f5f9;"">
                        <div style=""font-weight: 600; color: #4f46e5; font-size: 15px; margin-bottom: 10px;"">{role}</div>
                        <table width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""font-size: 13px; color: #334155;"">
                            <tr>
                                <td width=""33%"" valign=""top""><strong style=""display: block; font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px;"">Name</strong>{m.Name}</td>
                                <td width=""33%"" valign=""top""><strong style=""display: block; font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px;"">Telephone</strong>{m.Telephone}</td>
                                <td width=""34%"" valign=""top""><strong style=""display: block; font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px;"">Email</strong><a href=""mailto:{m.Email}"" style=""color: #4f46e5;"">{m.Email}</a></td>
                            </tr>
                        </table>
                    </div>");
            }
        }

        RenderMemberModern("President", dto.ExecutiveCommittee.President);
        RenderMemberModern("Secretary", dto.ExecutiveCommittee.Secretary);
        RenderMemberModern("Treasurer", dto.ExecutiveCommittee.Treasurer);
        RenderMemberModern("Committee Member 1", dto.ExecutiveCommittee.CommitteeMember1);
        RenderMemberModern("Committee Member 2", dto.ExecutiveCommittee.CommitteeMember2);
        RenderMemberModern("Committee Member 3", dto.ExecutiveCommittee.CommitteeMember3);
        RenderMemberModern("Committee Member 4", dto.ExecutiveCommittee.CommitteeMember4);
        RenderMemberModern("Committee Member 5", dto.ExecutiveCommittee.CommitteeMember5);

        htmlBuilder.Append(@"
                </div>

                <!-- 03 Board of Directors -->
                <div style=""border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 30px;"">
                    <div style=""background-color: #f8fafc; padding: 15px 20px; border-bottom: 1px solid #e2e8f0; display: table; width: 100%;"">
                        <div style=""display: table-cell; vertical-align: middle; width: 35px;"">
                            <div style=""background-color: #6366f1; color: #ffffff; width: 26px; height: 26px; border-radius: 13px; text-align: center; line-height: 26px; font-size: 12px; font-weight: bold;"">03</div>
                        </div>
                        <div style=""display: table-cell; vertical-align: middle;"">
                            <h3 style=""margin: 0; font-size: 17px; font-weight: 600; color: #0f172a;"">Board & Previous Office Bearers</h3>
                        </div>
                    </div>
                    <table width=""100%"" cellpadding=""15"" cellspacing=""0"" border=""0"" style=""font-size: 14px; color: #334155;"">
");

        void RenderRep(string role, RepresentativeDto r)
        {
            if (!string.IsNullOrEmpty(r.Name))
            {
                htmlBuilder.Append($@"
                        <tr><td width=""35%"" style=""font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #f1f5f9; vertical-align: top;"">{role}</td><td style=""border-bottom: 1px solid #f1f5f9;""><strong>{r.Name}</strong><br/><span style=""color: #64748b; font-size: 13px;"">{r.Street}, {r.City}, {r.State} {r.Zip}<br/>{r.TelephoneAndEmail}</span></td></tr>
                ");
            }
        }

        RenderRep("Chairman", dto.BoardOfDirectors.Chairman);
        RenderRep("Secretary", dto.BoardOfDirectors.Secretary);
        RenderRep("Vice Chairman", dto.BoardOfDirectors.ViceChairman);
        
        for (int i = 0; i < dto.BoardOfDirectors.BoardMembers.Count; i++)
        {
            var m = dto.BoardOfDirectors.BoardMembers[i];
            if (!string.IsNullOrEmpty(m.Name))
            {
                RenderRep($"Board Member {i + 1}", m);
            }
        }

        if (!string.IsNullOrEmpty(dto.BoardOfDirectors.PastPresident.Name))
            htmlBuilder.Append($"<tr><td style=\"font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #f1f5f9;\">Past President</td><td style=\"border-bottom: 1px solid #f1f5f9;\"><strong>{dto.BoardOfDirectors.PastPresident.Name}</strong><br/><span style=\"color: #64748b; font-size: 13px;\">{dto.BoardOfDirectors.PastPresident.Telephone} - {dto.BoardOfDirectors.PastPresident.Email}</span></td></tr>");
        if (!string.IsNullOrEmpty(dto.BoardOfDirectors.PastSecretary.Name))
            htmlBuilder.Append($"<tr><td style=\"font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #f1f5f9;\">Past Secretary</td><td style=\"border-bottom: 1px solid #f1f5f9;\"><strong>{dto.BoardOfDirectors.PastSecretary.Name}</strong><br/><span style=\"color: #64748b; font-size: 13px;\">{dto.BoardOfDirectors.PastSecretary.Telephone} - {dto.BoardOfDirectors.PastSecretary.Email}</span></td></tr>");
        if (!string.IsNullOrEmpty(dto.BoardOfDirectors.PastTreasurer.Name))
            htmlBuilder.Append($"<tr><td style=\"font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px;\">Past Treasurer</td><td><strong>{dto.BoardOfDirectors.PastTreasurer.Name}</strong><br/><span style=\"color: #64748b; font-size: 13px;\">{dto.BoardOfDirectors.PastTreasurer.Telephone} - {dto.BoardOfDirectors.PastTreasurer.Email}</span></td></tr>");

        htmlBuilder.Append(@"
                    </table>
                </div>
                
                <!-- 04 Documents -->
                <div style=""border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;"">
                    <div style=""background-color: #f8fafc; padding: 15px 20px; border-bottom: 1px solid #e2e8f0; display: table; width: 100%;"">
                        <div style=""display: table-cell; vertical-align: middle; width: 35px;"">
                            <div style=""background-color: #6366f1; color: #ffffff; width: 26px; height: 26px; border-radius: 13px; text-align: center; line-height: 26px; font-size: 12px; font-weight: bold;"">04</div>
                        </div>
                        <div style=""display: table-cell; vertical-align: middle;"">
                            <h3 style=""margin: 0; font-size: 17px; font-weight: 600; color: #0f172a;"">Supporting Documents & Attachments</h3>
                        </div>
                    </div>
                    <table width=""100%"" cellpadding=""15"" cellspacing=""0"" border=""0"" style=""font-size: 14px; color: #334155;"">
");
        foreach (var doc in dto.Documents)
        {
            htmlBuilder.Append($"<tr><td width=\"35%\" style=\"font-weight: 600; color: #64748b; text-transform: uppercase; font-size: 11px; border-bottom: 1px solid #f1f5f9;\">{doc.Type}</td><td style=\"border-bottom: 1px solid #f1f5f9;\"><span style='display: inline-block; padding: 6px 12px; background-color: #e0e7ff; color: #4338ca; border-radius: 6px; font-size: 13px; font-weight: 600;'>{doc.Name}</span></td></tr>");
        }
        if (dto.Documents.Count == 0)
            htmlBuilder.Append("<tr><td colspan='2' style='text-align: center; font-style: italic; color: #94a3b8;'>No documents attached</td></tr>");

        htmlBuilder.Append($@"
                    </table>
                </div>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style=""background-color: #1e293b; color: #cbd5e1; padding: 25px; text-align: center; font-size: 13px;"">
                <div style=""color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 8px;"">Administrative Review</div>
                <div style=""margin-bottom: 15px;"">Open the application in the Membership Administration Portal to review the complete submission.</div>
                <div style=""font-size: 11px; color: #64748b; border-top: 1px solid #334155; padding-top: 15px;"">This is an automated notification from the Federation Membership Portal.<br/>Please do not reply directly to this message.</div>
            </td>
        </tr>
    </table>
</body>
</html>
");

        var emailClient = new EmailClient(connectionString);
        var content = new EmailContent($"Registration Received - {dto.AssociationName}")
        {
            PlainText = $"Hello,\n\nYour registration request for {dto.AssociationName} has been successfully received.\n\nThank you.",
            Html = htmlBuilder.ToString()
        };
        
        var toEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(dto.ContactEmail)) toEmails.Add(dto.ContactEmail.Trim());
        if (!string.IsNullOrWhiteSpace(dto.ExecutiveCommittee.President.Email)) toEmails.Add(dto.ExecutiveCommittee.President.Email.Trim());
        if (!string.IsNullOrWhiteSpace(dto.ExecutiveCommittee.Secretary.Email)) toEmails.Add(dto.ExecutiveCommittee.Secretary.Email.Trim());
        if (!string.IsNullOrWhiteSpace(dto.ExecutiveCommittee.Treasurer.Email)) toEmails.Add(dto.ExecutiveCommittee.Treasurer.Email.Trim());

        var recipientAddresses = toEmails.Where(e => !string.IsNullOrWhiteSpace(e)).Select(e => new EmailAddress(e)).ToList();
        
        if (!recipientAddresses.Any())
        {
            // If completely empty, at least try to send to admin if configured, or just skip
            recipientAddresses.Add(new EmailAddress("noreply@example.com")); 
        }

        var recipients = new EmailRecipients(recipientAddresses);
        
        var bccEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        bccEmails.Add("info@shajijohns.com");
        bccEmails.Add("kalashahi@yahoo.com"); // Typo fixed from 'kalashahi@yahoo.c.com'
        
        if (!string.IsNullOrEmpty(adminRecipients))
        {
            var adminEmails = adminRecipients.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var adminEmail in adminEmails)
            {
                bccEmails.Add(adminEmail.Trim());
            }
        }
        
        foreach (var bcc in bccEmails)
        {
            if (!string.IsNullOrWhiteSpace(bcc))
            {
                recipients.BCC.Add(new EmailAddress(bcc));
            }
        }

        var message = new EmailMessage(senderAddress, recipients, content);

        if (dto.Documents != null && dto.Documents.Any())
        {
            foreach (var doc in dto.Documents)
            {
                if (string.IsNullOrWhiteSpace(doc.Path)) continue;
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "uploads", doc.Path);
                if (System.IO.File.Exists(filePath))
                {
                    try
                    {
                        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                        var attachment = new EmailAttachment(doc.Name, "application/octet-stream", new BinaryData(fileBytes));
                        message.Attachments.Add(attachment);
                    }
                    catch (Exception ex)
                    {
                        // Log or handle attachment error silently so email still sends
                        Console.WriteLine($"Failed to attach file {doc.Name}: {ex.Message}");
                    }
                }
            }
        }
        
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
    public RepresentativeDto Chairman { get; set; } = new();
    public RepresentativeDto Secretary { get; set; } = new();
    public RepresentativeDto ViceChairman { get; set; } = new();
    public List<RepresentativeDto> BoardMembers { get; set; } = new();

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
