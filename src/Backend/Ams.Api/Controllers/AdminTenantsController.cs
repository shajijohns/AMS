using Ams.Domain.Entities;
using Ams.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;
using Microsoft.AspNetCore.SignalR;
using Ams.Api.Hubs;
using Ams.Api.Services;

namespace Ams.Api.Controllers;

public class TenantCreateDto
{
    public string LegalName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Fee { get; set; }
    public string EIN_Encrypted { get; set; } = string.Empty;
    public string StateRegNumber { get; set; } = string.Empty;
    public DateTime? StateRegDate { get; set; }
    public string StateOfIncorporation { get; set; } = string.Empty;
}

public class InviteTenantDto
{
    public string Email { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<IFormFile> Attachments { get; set; } = new();
}

[Authorize]
[ApiController]
[Route("api/admin/tenants")]
public class AdminTenantsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<MapHub> _hubContext;
    private readonly IMapDataService _mapDataService;

    public AdminTenantsController(ApplicationDbContext context, IHubContext<MapHub> hubContext, IMapDataService mapDataService)
    {
        _context = context;
        _hubContext = hubContext;
        _mapDataService = mapDataService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTenants([FromQuery] string status = "")
    {
        var query = _context.Tenants.AsQueryable();
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(t => t.Status == status);
        }

        var tenants = await query
            .OrderByDescending(t => t.CreatedUtc)
            .ToListAsync();

        return Ok(tenants);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTenant([FromBody] TenantCreateDto dto)
    {
        var tenant = new Tenant
        {
            LegalName = dto.LegalName,
            DisplayName = string.IsNullOrEmpty(dto.DisplayName) ? dto.LegalName : dto.DisplayName,
            Type = dto.Type,
            Fee = dto.Fee,
            Status = "Active",
            EIN_Encrypted = dto.EIN_Encrypted,
            StateRegNumber = dto.StateRegNumber,
            StateRegDate = dto.StateRegDate,
            StateOfIncorporation = dto.StateOfIncorporation
        };

        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();
        
        await _hubContext.Clients.All.SendAsync("MapDataUpdated", await _mapDataService.GetMapDataAsync());

        return Ok(new { Message = "Tenant created successfully.", TenantId = tenant.Id });
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveTenant(Guid id)
    {
        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null) return NotFound();

        tenant.Status = "Active";
        await _context.SaveChangesAsync();

        await _hubContext.Clients.All.SendAsync("MapDataUpdated", await _mapDataService.GetMapDataAsync());

        return Ok(new { Message = "Tenant approved and activated successfully." });
    }

    [HttpPost("{id}/deny")]
    public async Task<IActionResult> DenyTenant(Guid id)
    {
        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null) return NotFound();

        tenant.Status = "Denied";
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Tenant denied." });
    }

    [HttpPost("{id}/deactivate")]
    public async Task<IActionResult> DeactivateTenant(Guid id)
    {
        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant == null) return NotFound();

        tenant.Status = "Inactive";
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Tenant deactivated." });
    }

    [HttpPost("invite")]
    public async Task<IActionResult> InviteTenant([FromForm] InviteTenantDto dto)
    {
        var invite = new TenantInvitation
        {
            Email = dto.Email,
            Message = dto.Message,
            Status = "Sent",
            SentUtc = DateTime.UtcNow
        };
        
        _context.TenantInvitations.Add(invite);
        await _context.SaveChangesAsync();

        Console.WriteLine($"\n========================================================");
        Console.WriteLine($"[EMAIL SYSTEM SIMULATION]");
        Console.WriteLine($"Inviting Tenant: {dto.Email}");
        Console.WriteLine($"Message: {dto.Message}");
        Console.WriteLine($"Tracking Link: http://localhost:5173/register?inviteId={invite.Id}");
        Console.WriteLine($"Attachments: {dto.Attachments.Count}");
        Console.WriteLine($"========================================================\n");
        return Ok(new { Message = "Invitation sent successfully." });
    }

    [HttpGet("invites")]
    public async Task<IActionResult> GetTenantInvitations()
    {
        var invites = await _context.TenantInvitations
            .OrderByDescending(i => i.SentUtc)
            .ToListAsync();
        return Ok(invites);
    }

    [HttpPost("invites/{id}/resend")]
    public async Task<IActionResult> ResendInvitation(Guid id)
    {
        var invite = await _context.TenantInvitations.FindAsync(id);
        if (invite == null) return NotFound();

        invite.ResentCount++;
        invite.LastResentUtc = DateTime.UtcNow;
        if (invite.Status != "Accepted")
        {
            invite.Status = "Sent"; // Reset status if they hadn't accepted
        }
        await _context.SaveChangesAsync();

        Console.WriteLine($"\n========================================================");
        Console.WriteLine($"[EMAIL SYSTEM SIMULATION - RESEND]");
        Console.WriteLine($"Resending to Tenant: {invite.Email}");
        Console.WriteLine($"Message: {invite.Message}");
        Console.WriteLine($"Tracking Link: http://localhost:5173/register?inviteId={invite.Id}");
        Console.WriteLine($"========================================================\n");
        return Ok(new { Message = "Invitation resent successfully." });
    }
}
