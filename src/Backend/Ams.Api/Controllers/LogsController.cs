using Microsoft.AspNetCore.Mvc;

namespace Ams.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LogsController : ControllerBase
{
    private readonly ILogger<LogsController> _logger;

    public LogsController(ILogger<LogsController> logger)
    {
        _logger = logger;
    }

    [HttpPost]
    public IActionResult LogFrontendEvent([FromBody] FrontendLogRequest request)
    {
        if (request == null)
            return BadRequest();

        // Using structured logging. Serilog will store these properties.
        switch (request.Level?.ToLower())
        {
            case "error":
                _logger.LogError("Frontend Error: {Message} | URL: {Url} | Stack: {StackTrace}", 
                    request.Message, request.Url, request.StackTrace);
                break;
            case "warn":
            case "warning":
                _logger.LogWarning("Frontend Warning: {Message} | URL: {Url}", 
                    request.Message, request.Url);
                break;
            case "info":
            case "information":
            default:
                _logger.LogInformation("Frontend Info: {Message} | URL: {Url}", 
                    request.Message, request.Url);
                break;
        }

        return Ok();
    }
}

public class FrontendLogRequest
{
    public string Level { get; set; } = "info";
    public string Message { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? StackTrace { get; set; }
}
