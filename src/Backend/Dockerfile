FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy the solution file and restore dependencies
COPY ["Ams.slnx", "./"]
COPY ["Ams.Api/Ams.Api.csproj", "Ams.Api/"]
COPY ["Ams.Domain/Ams.Domain.csproj", "Ams.Domain/"]
COPY ["Ams.Infrastructure/Ams.Infrastructure.csproj", "Ams.Infrastructure/"]
RUN dotnet restore "Ams.Api/Ams.Api.csproj"

# Copy the remaining source code
COPY . .
WORKDIR "/app/Ams.Api"
RUN dotnet build "Ams.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Ams.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Ams.Api.dll"]
