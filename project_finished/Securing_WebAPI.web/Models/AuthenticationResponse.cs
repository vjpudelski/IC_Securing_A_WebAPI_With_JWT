namespace Securing_WebAPI.web.Models
{
  public class AuthenticationResponse
  {
    public string? Token { get; set; }
    public User? User { get; set; }
  }
}