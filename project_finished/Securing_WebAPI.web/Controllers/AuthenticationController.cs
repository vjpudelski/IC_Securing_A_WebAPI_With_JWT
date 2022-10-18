using Microsoft.AspNetCore.Mvc;
using Securing_WebAPI.web.Models;
using Securing_WebAPI.web.Services;

namespace Securing_WebAPI.web.Controllers
{
  [ApiController]
  [Route("[controller]")]
  public class AuthenticationController : ControllerBase
  {
    public IConfiguration _configuration;

    public AuthService _authService;

    public AuthenticationController(IConfiguration config)
    {
      _configuration = config;
      _authService = new AuthService(config);
    }

    [HttpPost("login")]
    public AuthenticationResponse Login([FromBody] AuthenticationRequest loginInfo)
    {
      var response = new AuthenticationResponse();

      try
      {
        if (loginInfo.UserName == null || loginInfo.Password == null)
        {
          throw new Exception("invalid username or password");
        }

        response.User = _authService.Login(loginInfo.UserName, loginInfo.Password);

        response.Token = _authService.GenerateToken(response.User);
      }
      catch (Exception ex)
      {
        Console.WriteLine(ex);
        HttpContext.Response.StatusCode = 401;
      }

      return response;
    }
  }
}