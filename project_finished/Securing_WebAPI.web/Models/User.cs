using System.Text.Json.Serialization;

namespace Securing_WebAPI.web.Models
{
  public class User
  {
    public int ID { get; set; }
    public string Name { get; set; } = "";
    public string UserName { get; set; } = "";
    public string Role { get; set; } = "";

    [JsonIgnore]
    public string Password { get; set; } = "";
  }
}