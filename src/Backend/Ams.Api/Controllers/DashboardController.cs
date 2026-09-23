using Ams.Api.Models;
using Ams.Api.Services;
using Ams.Domain.Entities;
using Ams.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Ams.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapDataService _mapDataService;

    public DashboardController(ApplicationDbContext context, IMapDataService mapDataService)
    {
        _context = context;
        _mapDataService = mapDataService;
    }

    private static readonly Dictionary<string, double[]> CoordinatesMap = new(StringComparer.OrdinalIgnoreCase)
    {
        { "United States", new[] { -95.7129, 37.0902 } },
        { "Germany", new[] { 10.4515, 51.1657 } },
        { "France", new[] { 2.2137, 46.2276 } },
        { "United Kingdom", new[] { -3.4359, 55.3781 } },
        { "Canada", new[] { -106.3468, 56.1304 } },
        { "Australia", new[] { 133.7751, -25.2744 } },
        { "Maldives", new[] { 73.2207, 3.2028 } },
        { "Palau", new[] { 134.5825, 7.5149 } },
        { "GA", new[] { -83.4411, 32.1656 } },
        { "Georgia", new[] { -83.4411, 32.1656 } },
        { "NY", new[] { -75.5268, 42.1657 } },
        { "New York", new[] { -75.5268, 42.1657 } },
        { "CA", new[] { -119.4179, 36.7783 } },
        { "California", new[] { -119.4179, 36.7783 } },
        { "TX", new[] { -99.9018, 31.9686 } },
        { "Texas", new[] { -99.9018, 31.9686 } },
        { "FL", new[] { -81.5158, 27.6648 } },
        { "Florida", new[] { -81.5158, 27.6648 } }
    };

    [HttpGet("stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var tenants = await _context.Tenants.ToListAsync();
        var totalMembers = await _context.Members.CountAsync();
        
        // Sum the AmountPaid of all Paid invoices
        var totalRevenue = await _context.Invoices
            .Where(i => i.Status == Ams.Domain.Enums.InvoiceStatus.Paid)
            .SumAsync(i => i.AmountPaid);

        var totalAssociations = tenants.Count;
        var pendingApprovals = tenants.Count(t => t.Status == "PendingOnboarding" || t.Status == "Pending");
        
        var topAssociations = tenants
            .OrderByDescending(t => t.LegalName)
            .Take(10)
            .Select(t => new
            {
                name = string.IsNullOrEmpty(t.DisplayName) ? t.LegalName : t.DisplayName,
                members = new Random(t.Id.GetHashCode()).Next(10, 500)
            })
            .OrderByDescending(t => t.members)
            .ToList();

        var response = new
        {
            totalAssociations = totalAssociations,
            associationsDelta = tenants.Count(t => t.CreatedUtc >= DateTime.UtcNow.AddMonths(-1)),
            totalMembers = totalMembers,
            membersGrowthPct = 5.2,
            totalRevenue = totalRevenue,
            revenueTrend = "up",
            pendingApprovals = pendingApprovals,
            overdueDues = 4500.00,
            activeEvents = 12,
            
            recentRegistrations = tenants
                .OrderByDescending(t => t.CreatedUtc)
                .Take(5)
                .Select(t => new {
                    id = t.Id,
                    name = string.IsNullOrEmpty(t.DisplayName) ? t.LegalName : t.DisplayName,
                    type = t.Type,
                    status = t.Status,
                    createdUtc = t.CreatedUtc
                }),
                
            memberGrowthData = new[] {
                new { name = "Jan", members = 400, @new = 50 },
                new { name = "Feb", members = 600, @new = 200 },
                new { name = "Mar", members = 800, @new = 200 },
                new { name = "Apr", members = 1000, @new = 200 },
                new { name = "May", members = 1150, @new = 150 },
                new { name = "Jun", members = 1250, @new = 100 }
            },
            
            revenueTrendData = new[] {
                new { month = "Jan", collected = 5000, expected = 5200 },
                new { month = "Feb", collected = 6000, expected = 6000 },
                new { month = "Mar", collected = 7500, expected = 7000 },
                new { month = "Apr", collected = 8000, expected = 8500 },
                new { month = "May", collected = 11000, expected = 10000 },
                new { month = "Jun", collected = 14500, expected = 14000 }
            },
            
            membershipByTenantType = tenants
                .GroupBy(t => t.Type)
                .Select(g => new { name = string.IsNullOrEmpty(g.Key) ? "Unknown" : g.Key, value = g.Count() })
                .ToList(),
                
            topAssociations = topAssociations,
            
            renewalRateData = new[] {
                new { period = "Q1", renewed = 400, lapsed = 50 },
                new { period = "Q2", renewed = 350, lapsed = 80 },
                new { period = "Q3", renewed = 450, lapsed = 40 }
            },
            
            marketLocations = Array.Empty<object>(),
            
            pendingTenantApprovals = tenants
                .Where(t => t.Status == "PendingOnboarding" || t.Status == "Pending")
                .Take(5)
                .Select(t => new {
                    id = t.Id,
                    name = t.LegalName,
                    type = t.Type,
                    submitted = t.CreatedUtc.ToString("yyyy-MM-dd")
                }),
                
            expiringMemberships = new[] {
                new { id = 101, name = "John Doe", association = "NY Dental", expires = "2026-09-20" },
                new { id = 102, name = "Jane Smith", association = "TX Teachers", expires = "2026-09-25" }
            },
            
            failedPayments = new[] {
                new { id = 201, name = "Alice Brown", amount = 150, date = "2026-09-10", reason = "Card Expired" }
            },
            
            openDsrs = new[] {
                new { id = 301, user = "Bob Wilson", type = "Deletion", due = "2026-09-18", daysOld = 25 }
            },
            
            upcomingEvents = new[] {
                new { id = 401, name = "Annual Conference", date = "2026-10-01", association = "NY Dental" },
                new { id = 402, name = "Fall Seminar", date = "2026-10-15", association = "CA Med Society" }
            },
            
            recentActivity = new[] {
                new { id = 501, text = "Admin approved member Jane Smith", time = "2 hours ago" },
                new { id = 502, text = "Payment $150 received from Bob Wilson", time = "4 hours ago" }
            },
            
            auditSummary = new { loginsToday = 45, adminActions = 12 },
            emailSmsStatus = new { sent = 1200, bounced = 15, failed = 5 }
        };

        return Ok(response);
    }

    [HttpGet("map-data")]
    public async Task<IActionResult> GetMapData()
    {
        var locations = await _mapDataService.GetMapDataAsync();
        return Ok(locations);
    }

    [HttpGet("world-map")]
    public async Task<IActionResult> GetWorldMap()
    {
        var allRequests = await _context.AssociationRequests
            .Where(r => !r.IsDeleted)
            .ToListAsync();

        var parsedRequests = allRequests
            .Select(r => 
            {
                try {
                    var payload = System.Text.Json.JsonSerializer.Deserialize<Ams.Api.Controllers.AssociationRequestDto>(r.PayloadJson);
                    var country = !string.IsNullOrWhiteSpace(payload?.Country) ? payload.Country : "United States";
                    var state = !string.IsNullOrWhiteSpace(payload?.State) ? payload.State : payload?.StateOfIncorporation;
                    
                    if (string.IsNullOrEmpty(state)) return null;

                    // Normalize names to match CoordinatesMap keys
                    if (state.Equals("US", StringComparison.OrdinalIgnoreCase) || state.Equals("USA", StringComparison.OrdinalIgnoreCase)) country = "United States";
                    
                    // Simple normalization for common states to lookup properly if we don't have them in dictionary
                    var lookupKey = state;
                    
                    return new { Country = country, Region = state, LookupKey = lookupKey, Status = r.Status.ToString() };
                } catch {
                    return null;
                }
            })
            .Where(x => x != null)
            .ToList();

        var locations = parsedRequests
            .GroupBy(x => new { Country = x!.Country, Region = x.Region, LookupKey = x.LookupKey })
            .Select(g => 
            {
                // Fallback to Country if Region is missing from map
                var coords = CoordinatesMap.TryGetValue(g.Key.LookupKey, out var regionCoords) 
                    ? regionCoords 
                    : (CoordinatesMap.TryGetValue(g.Key.Country, out var countryCoords) ? countryCoords : new[] { 0.0, 0.0 });
                
                var statuses = g.GroupBy(x => x!.Status)
                                .ToDictionary(sg => sg.Key, sg => sg.Count());
                
                return new WorldMapLocationDto
                {
                    Country = g.Key.Country,
                    Region = g.Key.Region,
                    Latitude = coords[1], // Latitude is Y
                    Longitude = coords[0], // Longitude is X in our map
                    Count = g.Count(),
                    Statuses = statuses
                };
            })
            .Where(x => x.Latitude != 0.0 || x.Longitude != 0.0) // Exclude totally unresolved
            .ToList();

        return Ok(locations);
    }
}
