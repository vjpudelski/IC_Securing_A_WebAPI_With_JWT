using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Securing_WebAPI.web.Models;
using Securing_WebAPI.web.Repositories;

namespace Securing_WebAPI.web.Services
{
  public class AuthService
  {
    private IConfiguration _config;
    private UserRepository _userRepo;

    public AuthService(IConfiguration config)
    {
      _config = config;
      _userRepo = new UserRepository(_config["ConnectionStrings:jwtConnection"]);
    }

    public User Login(string username, string password)
    {
      var user = _userRepo.GetUserByName(username);

      if (user == null) 
      {
        throw new Exception("invalid username or password");
      }

      if (!CheckPassword(password, user.Password))
      {
        throw new Exception("invalid username or password");
      }

      return user;
    }

    public string GenerateToken(User user)
    {
      // create the JSON Web Token
      // secret key is in appsettings.json
      var tokenHandler = new JwtSecurityTokenHandler();
      var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]);
      var tokenDescriptor = new SecurityTokenDescriptor
      {
        Issuer = _config["Jwt:Issuer"],
        Audience = _config["Jwt:Audience"],
        Subject = new ClaimsIdentity(SetClaims(user)),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
        Expires = DateTime.UtcNow.AddMinutes(value: double.Parse(_config["Jwt:Duration"]))
      };

      var token = tokenHandler.CreateToken(tokenDescriptor);
      return tokenHandler.WriteToken(token);
    }

    private bool CheckPassword(string entered, string actual)
    {
      return entered == actual;
    }

    private Claim[] SetClaims(User user)
    {
      var claims = new List<Claim>()
      {
        new Claim("UserID", user.ID.ToString()),
        new Claim("UserName", user.UserName)
      };

      claims.Add(new Claim(ClaimTypes.Role, user.Role));

      return claims.ToArray();
    }
  }
}