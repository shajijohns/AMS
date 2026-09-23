using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ams.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantUniqueIdToRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TenantUniqueId",
                table: "AssociationRequests",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TenantUniqueId",
                table: "AssociationRequests");
        }
    }
}
