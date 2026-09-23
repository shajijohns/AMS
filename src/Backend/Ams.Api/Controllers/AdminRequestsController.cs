using Ams.Domain.Entities;
using Ams.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Ams.Api.Hubs;
using Ams.Api.Services;

namespace Ams.Api.Controllers;

public class MoreInfoRequestDto
{
    public string Message { get; set; } = string.Empty;
}

public class DisapproveRequestDto
{
    public string Reason { get; set; } = string.Empty;
}

[Authorize]
[ApiController]
[Route("api/admin/association-requests")]
public class AdminRequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<MapHub> _hubContext;
    private readonly IMapDataService _mapDataService;

    public AdminRequestsController(ApplicationDbContext context, IHubContext<MapHub> hubContext, IMapDataService mapDataService)
    {
        _context = context;
        _hubContext = hubContext;
        _mapDataService = mapDataService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRequests()
    {
        var requests = await _context.AssociationRequests
            .OrderByDescending(r => r.CreatedUtc)
            .Select(r => new
            {
                r.Id,
                r.Status,
                r.SubmittedByEmail,
                r.TenantUniqueId,
                r.CreatedUtc,
                r.PayloadJson
            })
            .ToListAsync();

        return Ok(requests);
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveRequest(Guid id)
    {
        var request = await _context.AssociationRequests.FindAsync(id);
        if (request == null) return NotFound();

        request.Status = Ams.Domain.Enums.RequestStatus.Approved;
        await _context.SaveChangesAsync();
        
        // Broadcast map update
        await _hubContext.Clients.All.SendAsync("MapDataUpdated", await _mapDataService.GetMapDataAsync());
        
        return Ok(new { Message = "Request approved successfully." });
    }

    [HttpPost("{id}/more-info")]
    public async Task<IActionResult> RequestMoreInfo(Guid id, [FromBody] MoreInfoRequestDto dto)
    {
        var request = await _context.AssociationRequests.FindAsync(id);
        if (request == null) return NotFound();

        request.Status = Ams.Domain.Enums.RequestStatus.MoreInfoRequested;
        request.ReviewerNotes = string.IsNullOrEmpty(request.ReviewerNotes) 
            ? dto.Message 
            : request.ReviewerNotes + "\n\nMore Info Requested: " + dto.Message;

        // Simulate sending email
        Console.WriteLine($"\n========================================================");
        Console.WriteLine($"[EMAIL SYSTEM SIMULATION]");
        Console.WriteLine($"To: {request.SubmittedByEmail}");
        Console.WriteLine($"Subject: Additional Information Required for your Association Request");
        Console.WriteLine($"Body: {dto.Message}");
        Console.WriteLine($"========================================================\n");

        await _context.SaveChangesAsync();
        return Ok(new { Message = "More info requested successfully." });
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectRequest(Guid id)
    {
        var request = await _context.AssociationRequests.FindAsync(id);
        if (request == null) return NotFound();

        request.Status = Ams.Domain.Enums.RequestStatus.Rejected;
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Request deactivated/rejected successfully." });
    }

    [HttpPost("{id}/disapprove")]
    public async Task<IActionResult> DisapproveRequest(Guid id, [FromBody] DisapproveRequestDto dto)
    {
        var request = await _context.AssociationRequests.FindAsync(id);
        if (request == null) return NotFound();

        request.Status = Ams.Domain.Enums.RequestStatus.Rejected;
        request.ReviewerNotes = string.IsNullOrEmpty(request.ReviewerNotes) 
            ? "Disapproved Reason: " + dto.Reason 
            : request.ReviewerNotes + "\n\nDisapproved Reason: " + dto.Reason;

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Request disapproved successfully." });
    }
}
