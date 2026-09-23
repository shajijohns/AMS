namespace Ams.Api.Models;

public class WorldMapLocationDto
{
    public string Country { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int Count { get; set; }
    public Dictionary<string, int> Statuses { get; set; } = new();
}
