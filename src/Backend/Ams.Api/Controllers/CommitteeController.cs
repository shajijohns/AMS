using Ams.Domain.Entities;
using Ams.Domain.Enums;
using Ams.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Ams.Api.Hubs;
using Ams.Api.Services;

namespace Ams.Api.Controllers;

[ApiController]
[Route("api/committee/requests")]
// [Authorize(Roles = "SuperAdmin,CommitteeMember")] // Commented out for local testing without JWT setup
public class CommitteeController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<MapHub> _hubContext;
    private readonly IMapDataService _mapDataService;

    public CommitteeController(ApplicationDbContext context, IHubContext<MapHub> hubContext, IMapDataService mapDataService)
    {
        _context = context;
        _hubContext = hubContext;
        _mapDataService = mapDataService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRequests([FromQuery] RequestStatus? status)
    {
        var query = _context.AssociationRequests.AsQueryable();
        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        var requests = await query.OrderByDescending(r => r.CreatedUtc).ToListAsync();
        return Ok(requests);
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> ApproveRequest(Guid id)
    {
        var request = await _context.AssociationRequests.FindAsync(id);
        if (request == null) return NotFound();

        request.Status = RequestStatus.Approved;
        request.DecisionUtc = DateTime.UtcNow;
        // Generate a 72-hour secure token for onboarding
        request.SecureOnboardingToken = Guid.NewGuid().ToString("N");
        request.TokenExpiresUtc = DateTime.UtcNow.AddHours(72);

        // Provision the tenant record
        var tenant = new Tenant
        {
            LegalName = "Extracted from Payload", // In reality, parse from PayloadJson
            DisplayName = "Extracted from Payload",
            Status = "PendingOnboarding"
        };
        _context.Tenants.Add(tenant);

        await _context.SaveChangesAsync();
        
        // Broadcast map update
        await _hubContext.Clients.All.SendAsync("MapDataUpdated", await _mapDataService.GetMapDataAsync());

        return Ok(new { Message = "Approved and tenant provisioned.", OnboardingToken = request.SecureOnboardingToken });
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> RejectRequest(Guid id, [FromBody] RejectDto dto)
    {
        var request = await _context.AssociationRequests.FindAsync(id);
        if (request == null) return NotFound();

        request.Status = RequestStatus.Rejected;
        request.DecisionUtc = DateTime.UtcNow;
        request.ReviewerNotes = dto.Reason;

        await _context.SaveChangesAsync();

        return Ok(new { Message = "Request rejected." });
    }
}

public class RejectDto
{
    public string Reason { get; set; } = string.Empty;
}
