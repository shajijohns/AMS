namespace Ams.Infrastructure.Tenancy;

public interface ITenantProvider
{
    Guid? GetCurrentTenantId();
}
