using Ams.Domain.Common;
using Ams.Domain.Entities;
using Ams.Infrastructure.Tenancy;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Ams.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    private readonly ITenantProvider _tenantProvider;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ITenantProvider tenantProvider)
        : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<AuditEvent> AuditEvents { get; set; }
    public DbSet<SystemConfiguration> SystemConfigurations { get; set; }
    public DbSet<TenantInvitation> TenantInvitations { get; set; }
    public DbSet<AssociationRequest> AssociationRequests { get; set; }
    public DbSet<Officer> Officers { get; set; }
    
    public DbSet<Member> Members { get; set; }
    public DbSet<FamilyMember> FamilyMembers { get; set; }
    public DbSet<Invitation> Invitations { get; set; }
    public DbSet<ConsentRecord> ConsentRecords { get; set; }
    
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<PaymentMethod> PaymentMethods { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        var tenantId = _tenantProvider.GetCurrentTenantId();

        // Global query filter for TenantId on ApplicationUser
        builder.Entity<ApplicationUser>().HasQueryFilter(u => 
            !u.IsDeleted && (tenantId == null || u.TenantId == tenantId));

        builder.Entity<Officer>().HasQueryFilter(o => 
            !o.IsDeleted && (tenantId == null || o.TenantId == tenantId));
        builder.Entity<AssociationRequest>().HasQueryFilter(r => !r.IsDeleted);
        builder.Entity<SystemConfiguration>().HasQueryFilter(s => 
            !s.IsDeleted && (tenantId == null || s.TenantId == null || s.TenantId == tenantId));
        builder.Entity<TenantInvitation>().HasQueryFilter(t => !t.IsDeleted);

        // Global query filters for Phase 3 entities
        builder.Entity<Member>().HasQueryFilter(m => 
            !m.IsDeleted && (tenantId == null || m.TenantId == tenantId));
        builder.Entity<FamilyMember>().HasQueryFilter(f => !f.IsDeleted);
        builder.Entity<Invitation>().HasQueryFilter(i => 
            !i.IsDeleted && (tenantId == null || i.TenantId == tenantId));
        builder.Entity<ConsentRecord>().HasQueryFilter(c => 
            !c.IsDeleted && (tenantId == null || c.TenantId == tenantId));

        // Global query filters for Phase 4 entities
        builder.Entity<Invoice>().HasQueryFilter(i => 
            !i.IsDeleted && (tenantId == null || i.TenantId == tenantId));
        builder.Entity<Payment>().HasQueryFilter(p => 
            !p.IsDeleted && (tenantId == null || p.TenantId == tenantId));
        builder.Entity<PaymentMethod>().HasQueryFilter(pm => 
            !pm.IsDeleted && (tenantId == null || pm.TenantId == tenantId));

        // Global query filter for soft delete on Tenants
        builder.Entity<Tenant>().HasQueryFilter(t => !t.IsDeleted);
        builder.Entity<Tenant>().Property(t => t.Fee).HasPrecision(18, 2);

        builder.Entity<AuditEvent>().HasKey(a => a.AuditId);
        // Audit events are append only, no soft delete filter needed.
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedUtc = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.ModifiedUtc = DateTime.UtcNow;
                    break;
                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.DeletedUtc = DateTime.UtcNow;
                    break;
            }
        }
        
        foreach (var entry in ChangeTracker.Entries<ApplicationUser>())
        {
            if (entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
