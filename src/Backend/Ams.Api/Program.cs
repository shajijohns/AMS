using Ams.Domain.Entities;
using Ams.Domain.Enums;
using Ams.Infrastructure.Persistence;
using Ams.Infrastructure.Tenancy;
using Ams.Infrastructure.Services;
using Ams.Api.Hubs;
using Ams.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Serilog;
using Scalar.AspNetCore;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("/app/logs/log.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Configure DataProtection to persist keys across Docker restarts
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo("/app/keys"));

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes.Add("cookieAuth", new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.ApiKey,
            In = ParameterLocation.Cookie,
            Name = ".AspNetCore.Identity.Application",
            Description = "Cookie authentication. Note: You must first authenticate using the frontend or the /api/auth/login endpoint before testing protected endpoints here."
        });
        document.SecurityRequirements.Add(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "cookieAuth" }
                },
                Array.Empty<string>()
            }
        });
        return Task.CompletedTask;
    });
});
builder.Services.AddControllers();

// Add multitenancy and generic services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantProvider, DummyTenantProvider>();
builder.Services.AddScoped<IPaymentGatewayService, PaymentGatewayService>();

// Register Interceptors
builder.Services.AddScoped<AuditInterceptor>();

// Add SignalR and Services
builder.Services.AddSignalR();
builder.Services.AddScoped<IMapDataService, MapDataService>();

// Configure Entity Framework and SQL Server
builder.Services.AddDbContext<ApplicationDbContext>((sp, options) =>
{
    var auditInterceptor = sp.GetRequiredService<AuditInterceptor>();
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
           .AddInterceptors(auditInterceptor);
});

// Configure Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Enable CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "https://federationapps-web.mangostone-9f65fdbe.eastus.azurecontainerapps.io"
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.HttpOnly = true;
    options.Events.OnRedirectToLogin = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        }
        else
        {
            context.Response.Redirect(context.RedirectUri);
        }
        return Task.CompletedTask;
    };
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("Ams API");
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<MapHub>("/api/hubs/map");

// Seed master user
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    // Retry logic for applying migrations (useful for Docker when DB is starting up)
    int retries = 5;
    while (retries > 0)
    {
        try
        {
            await dbContext.Database.MigrateAsync();
            break;
        }
        catch
        {
            retries--;
            if (retries == 0) throw;
            await Task.Delay(3000);
        }
    }
    
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var user = await userManager.FindByNameAsync("shajijohn");
    if (user == null)
    {
        user = new ApplicationUser 
        { 
            UserName = "shajijohn", 
            Email = "shajijohn@admin.local",
            FirstName = "Shaji",
            LastName = "John"
        };
        await userManager.CreateAsync(user, "Sh@ji2000$");
    }

    // Ensure FOKANA Master Tenant exists
    var fokanaTenant = await dbContext.Tenants.FirstOrDefaultAsync(t => t.LegalName == "Federation of Kerala Associations in North America");
    if (fokanaTenant == null)
    {
        fokanaTenant = new Tenant
        {
            LegalName = "Federation of Kerala Associations in North America",
            DisplayName = "FOKANA",
            Type = "Federation",
            Status = "Active"
        };
        dbContext.Tenants.Add(fokanaTenant);
        await dbContext.SaveChangesAsync();
    }

    var requestsWithoutTenantId = await dbContext.AssociationRequests
        .Where(r => string.IsNullOrEmpty(r.TenantUniqueId) && r.Status != RequestStatus.Draft)
        .ToListAsync();

    if (requestsWithoutTenantId.Any())
    {
        var random = new Random();
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        
        foreach (var req in requestsWithoutTenantId)
        {
            var idString = new string(Enumerable.Repeat(chars, 8).Select(s => s[random.Next(s.Length)]).ToArray());
            req.TenantUniqueId = $"TENANT-{idString}";
        }
        await dbContext.SaveChangesAsync();
    }
}

app.Run();

// Dummy implementation for compilation
public class DummyTenantProvider : ITenantProvider
{
    public Guid? GetCurrentTenantId()
    {
        return null; // Return null for SuperAdmin or public requests
    }
}
