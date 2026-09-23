using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ams.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantInvitationResendFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastResentUtc",
                table: "TenantInvitations",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ResentCount",
                table: "TenantInvitations",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastResentUtc",
                table: "TenantInvitations");

            migrationBuilder.DropColumn(
                name: "ResentCount",
                table: "TenantInvitations");
        }
    }
}
