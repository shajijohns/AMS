using Ams.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Ams.Api.Controllers;

namespace Ams.Api.Services;

public interface IMapDataService
{
    Task<object> GetMapDataAsync();
}

public class MapDataService : IMapDataService
{
    private readonly ApplicationDbContext _context;

    public MapDataService(ApplicationDbContext context)
    {
        _context = context;
    }

    private static readonly Dictionary<string, double[]> CoordinatesMap = new(StringComparer.OrdinalIgnoreCase)
    {
        // North America
        { "United States", new[] { -95.7129, 37.0902 } },
        { "Canada", new[] { -106.3468, 56.1304 } },
        { "Mexico", new[] { -102.5528, 23.6345 } },
        
        // Europe
        { "Germany", new[] { 10.4515, 51.1657 } },
        { "France", new[] { 2.2137, 46.2276 } },
        { "United Kingdom", new[] { -3.4359, 55.3781 } },
        { "Italy", new[] { 12.5674, 41.8719 } },
        { "Spain", new[] { -3.7492, 40.4637 } },
        { "Netherlands", new[] { 5.2913, 52.1326 } },
        { "Switzerland", new[] { 8.2275, 46.8182 } },
        { "Sweden", new[] { 18.6435, 60.1282 } },
        
        // Asia
        { "China", new[] { 104.1954, 35.8617 } },
        { "India", new[] { 78.9629, 20.5937 } },
        { "Japan", new[] { 138.2529, 36.2048 } },
        { "South Korea", new[] { 127.7669, 35.9078 } },
        { "Indonesia", new[] { 113.9213, -0.7893 } },
        { "Vietnam", new[] { 108.2772, 14.0583 } },
        { "Thailand", new[] { 100.9925, 15.8700 } },
        { "Philippines", new[] { 121.7740, 12.8797 } },
        
        // Middle East
        { "United Arab Emirates", new[] { 53.8478, 23.4241 } },
        { "Saudi Arabia", new[] { 45.0792, 23.8859 } },
        { "Israel", new[] { 34.8516, 31.0461 } },
        { "Turkey", new[] { 35.2433, 38.9637 } },
        
        // Oceania
        { "Australia", new[] { 133.7751, -25.2744 } },
        { "New Zealand", new[] { 174.8860, -40.9006 } },
        { "Palau", new[] { 134.5825, 7.5149 } },
        
        // South America
        { "Brazil", new[] { -51.9253, -14.2350 } },
        { "Argentina", new[] { -63.6167, -38.4161 } },
        { "Colombia", new[] { -74.2973, 4.5709 } },
        { "Chile", new[] { -71.5430, -35.6751 } },
        { "Peru", new[] { -75.0152, -9.1900 } },
        
        // Africa
        { "South Africa", new[] { 22.9375, -30.5595 } },
        { "Nigeria", new[] { 8.6753, 9.0820 } },
        { "Egypt", new[] { 30.8025, 26.8206 } },
        { "Kenya", new[] { 37.9062, -0.0236 } },
        { "Morocco", new[] { -7.0926, 31.7917 } },
        { "Algeria", new[] { 1.6596, 28.0339 } },
        { "Angola", new[] { 17.8739, -11.2027 } },
        
        // Misc/Islands
        { "Maldives", new[] { 73.2207, 3.2028 } },
        
        // Legacy State Codes (Fallback)
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

    public async Task<object> GetMapDataAsync()
    {
        var requests = await _context.AssociationRequests
            .Where(r => !r.IsDeleted)
            .ToListAsync();

        var parsedRequests = requests
            .Select(r => 
            {
                try {
                    var payload = System.Text.Json.JsonSerializer.Deserialize<AssociationRequestDto>(r.PayloadJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    var country = !string.IsNullOrWhiteSpace(payload?.Country) ? payload.Country : "United States";
                    var state = !string.IsNullOrWhiteSpace(payload?.State) ? payload.State : payload?.StateOfIncorporation;
                    
                    if (string.IsNullOrEmpty(state)) return null;

                    if (state.Equals("US", StringComparison.OrdinalIgnoreCase) || state.Equals("USA", StringComparison.OrdinalIgnoreCase)) country = "United States";
                    
                    return new { Country = country, State = state, Status = r.Status };
                } catch {
                    return null;
                }
            })
            .Where(x => x != null)
            .ToList();

        var locations = parsedRequests
            .GroupBy(x => new { Country = x!.Country, State = x.State })
            .Select(g => 
            {
                var coords = CoordinatesMap.TryGetValue(g.Key.State, out var regionCoords) 
                    ? regionCoords 
                    : (CoordinatesMap.TryGetValue(g.Key.Country, out var countryCoords) ? countryCoords : new[] { 0.0, 0.0 });
                
                var approvedCount = g.Count(r => r!.Status == Ams.Domain.Enums.RequestStatus.Approved);
                var pendingCount = g.Count(r => r!.Status == Ams.Domain.Enums.RequestStatus.Submitted || r!.Status == Ams.Domain.Enums.RequestStatus.MoreInfoRequested);
                
                return new
                {
                    name = g.Key.State,
                    coordinates = coords,
                    approvedCount = approvedCount,
                    pendingCount = pendingCount,
                    totalCount = approvedCount + pendingCount
                };
            })
            .Where(x => x.coordinates[0] != 0.0 || x.coordinates[1] != 0.0) // Must have coordinates
            .Where(x => x.totalCount > 0)
            .ToList();

        return locations;
    }
}
