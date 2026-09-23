using Ams.Domain.Entities;
using Ams.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Ams.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/admin/configuration")]
public class AdminConfigurationController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminConfigurationController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetConfiguration()
    {
        var configs = await _context.SystemConfigurations
            .Where(c => c.TenantId == null) // Global configurations
            .ToListAsync();
            
        var dict = configs.ToDictionary(c => c.ConfigKey, c => c.ConfigValue);
        return Ok(dict);
    }

    [HttpPost]
    public async Task<IActionResult> SaveConfiguration([FromBody] Dictionary<string, string> settings)
    {
        foreach (var kvp in settings)
        {
            var config = await _context.SystemConfigurations
                .FirstOrDefaultAsync(c => c.TenantId == null && c.ConfigKey == kvp.Key);
                
            if (config == null)
            {
                _context.SystemConfigurations.Add(new SystemConfiguration
                {
                    TenantId = null,
                    ConfigKey = kvp.Key,
                    ConfigValue = kvp.Value
                });
            }
            else
            {
                config.ConfigValue = kvp.Value;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Configuration saved successfully." });
    }
}
