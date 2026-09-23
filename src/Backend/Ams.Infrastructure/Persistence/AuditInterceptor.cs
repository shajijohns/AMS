using System.Text.Json;
using Ams.Domain.Entities;
using Ams.Infrastructure.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Ams.Infrastructure.Persistence;

public class AuditInterceptor : SaveChangesInterceptor
{
    private readonly ITenantProvider _tenantProvider;

    public AuditInterceptor(ITenantProvider tenantProvider)
    {
        _tenantProvider = tenantProvider;
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        if (eventData.Context is not null)
        {
            GenerateAuditEvents(eventData.Context);
        }
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null)
        {
            GenerateAuditEvents(eventData.Context);
        }
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void GenerateAuditEvents(DbContext context)
    {
        var entries = context.ChangeTracker.Entries().Where(e =>
            e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted).ToList();

        var tenantId = _tenantProvider.GetCurrentTenantId();
        
        foreach (var entry in entries)
        {
            // Do not audit the AuditEvents themselves
            if (entry.Entity is AuditEvent) continue;

            var auditEvent = new AuditEvent
            {
                Action = entry.State.ToString(),
                EntityType = entry.Entity.GetType().Name,
                TenantId = tenantId,
                OccurredUtc = DateTime.UtcNow,
                // In a real app, ActorUserId and Role would come from an ICurrentUserProvider
            };

            var primaryKey = entry.Metadata.FindPrimaryKey();
            if (primaryKey != null)
            {
                var keys = primaryKey.Properties.Select(p => entry.Property(p.Name).CurrentValue).ToArray();
                auditEvent.EntityId = string.Join(",", keys);
            }

            if (entry.State == EntityState.Added || entry.State == EntityState.Modified)
            {
                auditEvent.AfterJson = JsonSerializer.Serialize(entry.CurrentValues.ToObject());
            }

            if (entry.State == EntityState.Modified || entry.State == EntityState.Deleted)
            {
                // Note: Getting original values safely.
                try
                {
                    auditEvent.BeforeJson = JsonSerializer.Serialize(entry.OriginalValues.ToObject());
                }
                catch
                {
                    // Ignore for properties that might not have original values tracked fully
                }
            }

            context.Add(auditEvent);
        }
    }
}
