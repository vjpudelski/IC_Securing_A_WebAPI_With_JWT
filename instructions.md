# Lab Instructions

This document will walk through the steps to create and execute the lab performed with the conference session. the labo document is broken into different sections so that you may see how the whole things comes together even if the 
conference session only allows for a certain amount of the lab to be completed.

This lab assumes the following items have been installed and properly configured
- vscode
- dotnet 6+
- Sqlite

# Creating the Web Service Project from Scratch

These steps are only needed if you are not using the starter project provided in the */project_starter/* directory

## 1. Create the WebAPI Solution

```
dotnet new sln --name Securing_WebAPI
dotnet new webapi --name Securing_WebAPI.web
dotnet sln add Securing_WebAPI.web/Securing_WebAPI.web.csproj
```

At this point you can run the project using the following command to see it execute

```bash
dotnet watch run --project Securing_WebAPI.web/Securing_WebAPI.web.csproj
```

This is just the default WebAPI project and while there is nothing special done yet, the execution will confirm that
the project is properly setup.

## 2. Add the following package to the web project

to run this command you should be in the *Securing_WebAPI.web/* directory

```bash
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
```

JwtBearer since are working the Jwt Authentication.


## 3. Add authentication to the *program.cs* file 

this line goes after `builder.Services.AddControllers();`

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});
```

and then before `app.UseAuthorization();` add the following:

```csharp
app.UseAuthentication();
```

in adding that code the following namespaces need to be added if they are not done for you.

```csharp
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
```

## 4. Add settings for Jwt to the *appsettings.json* file.

this is a top level node which can go immediately following `"AllowedHosts"` setting. Make sure to add a comma ',' after
`"AllowedHosts"` if adding after it.

```json
  "Jwt": {
    "Key": "This-is-my-super-secret-key-dont-tell-anyone",
    "Issuer": "IndyCode2022",
    "Audience": "IndyCode2022",
    "Subject": "IndyCode2022_AccessToken",
    "Duration": "30"
  }
```

# Setting Up Our User Database

Steps 5 - 11 can be modified as you see fit for your implementation of the database

## 5. Create a */Securing_WebAPI.database/Sqlite/* directory in the root project folder. Note 2 new directories here

This directory will store your files for your implementation of the database. Here we will be using a 
simple sqlite database and will store a couple sql scripts and shell script for database creation.

This allows for creation of the database separate from the project. This is a personal preference and 
can be changed.

## 6. Create a new file in the */Securing_WebAPI.database/Sqlite/* called *generate.sh*

This file will run a couple sql scripts to generate our database. Include the following code in this file:

```bash
echo "cleaning up existing db..."
rm ../../securing_webapi.web/data/jwt_db.sqlite

echo "creating database tables"
sqlite3 ../../securing_webapi.web/data/jwt_db.sqlite < createdb.sql

echo "inserting test data"
sqlite3 ../../securing_webapi.web/data/jwt_db.sqlite < testdata.sql
```

Make sure to give yourself rights to execute the file

```bash
chmod +x generate.sh
```

This file assumes you are running the command inside the directory with the file.

## 7. Create a new file in the */Securing_WebAPI.database/Sqlite/* called *createdb.sql*

Inside this file include the sql statements to create the database schema for our jwt implementation

```sql
CREATE TABLE Users 
(
  ID INT,
  Name TEXT,
  UserName TEXT,
  Password TEXT,
  Role TEXT
);
```

We have a simplified implementation, so only one table.

## 8. Create a new file in */Securing_WebAPI.database/Sqlite/* called *testdata.sql*

Inside this file we will have the sql statement to fill our database with some sample data

```sql
INSERT INTO Users ( ID, Name, UserName, Password, Role ) VALUES 
( 1, "Administrator", "admin", "password", "admin" ), 
( 2, "User 1", "user", "password", "public" );
```

## 9. Create the */data/* directory inside the *Securing_WebAPI.web* project folder

This folder is required to execute the *generatedb.sh* script since it is putting the database file 
in that location. 

To test the database creation, execute the *generate.sh* script

```bash
./generate.sh
```

This assumes you are running the command inside the directory with the file.

## 10. Add the package *Microsoft.Data.Sqlite* to the project

```bash
dotnet add package Microsoft.Data.Sqlite
```

This should be run insode the *Securing_WebAPI.web* project.

Sqlite since that is the database type we are working with. If another database engine is used, modify
as appropriate. 

## 11. Add the connection string to the *appsettings.json* file.

If adding to the bottom of the file, make sure to add a comma ',' after the last node.

```json
  "ConnectionStrings": {
    "jwtConnection": "Data Source=data/jwt_db.sqlite"
  }
```

# Implementing the Backend Jwt Logic

## 12. Add the following directories inside the *Securing_WebAPI.web/* project folder

- Models
- Repositories
- Services

## 13. Create a new file in *Securing_WebAPI.web/Models/* called *User.cs*

This is the object representing our user. We have minimal properties for this object currently.

```csharp
using System.Text.Json.Serialization;

namespace Securing_WebAPI.web.Models
{
  public class User
  {
    public int ID { get; set; }
    public string Name { get; set; }
    public string UserName { get; set; }
    public string Role { get; set; }

    [JsonIgnore]
    public string Password { get; set; }
  }
}
```

Note: JsonIgnore is used to remove the property when streaming the object back to the client

You would never want to stream the user password back to the client application. All 
validation can be done server side without a need to send a password anywhere. Not allowing it 
to stream is already a security gain.

## 14. Create a new file in the *Securing_WebAPI.web/Repositories/* directory called *UserRepository.cs*

this file is strickly the interation of the database for the user objects

```csharp
using Microsoft.Data.Sqlite;
using Securing_WebAPI.web.Models;

namespace Securing_WebAPI.web.Repositories
{
  public class UserRepository
  {
    private const string _select_user_byusername = @"SELECT ID, Name, UserName, Password, Role FROM Users 
      WHERE UserName = @username";

    private readonly string _connectionString;

    public UserRepository(string connectionString)
    {
      _connectionString = connectionString;
    }

    public User? GetUserByName(string username)
    {
      User? user = null;

      using (var conn = new SqliteConnection(_connectionString))
      {
        conn.Open();

        var cmd = conn.CreateCommand();
        cmd.CommandText = _select_user_byusername;

        cmd.Parameters.AddWithValue("@username", username);

        using (var reader = cmd.ExecuteReader())
        {
          if (reader.Read())
          {
            user = MapReaderToUser(reader);
          }
        }
      }

      return user;
    }

    #region Mappers
    private User MapReaderToUser(SqliteDataReader row)
    {
      var user = new User();

      user.ID = row["ID"] as int? ?? default(int);
      user.Name = row["Name"].ToString() ?? string.Empty;
      user.UserName = row["UserName"].ToString() ?? string.Empty;
      user.Password = row["Password"].ToString() ?? string.Empty;
      user.Role = row["Role"].ToString() ?? string.Empty;

      return user;
    }
    #endregion
  }
}
```

## 15. Create a new file in the *Securing_WebAPI.web/Services/* directory called *AuthService.cs*

This file is the implementation of the logic for login and gneerating our token

```csharp
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
```

## 16. Create a new file in the *Securing_WebAPI.web/Models/* directory called *AuthenticationRequest.cs*

This will be the object used to transmit the username and password to the server to login.

```csharp
namespace Securing_WebAPI.web.Models
{
  public class AuthenticationRequest
  {
    public string? UserName { get; set; }
    public string? Password { get; set; }
  }
}
```

## 17. Create a new file in the *Securing_WebAPI.web/Models/* directory called *AuthenticationResponse.cs*

This will be the object used to return the user object and token from the login.

```csharp
namespace Securing_WebAPI.web.Models
{
  public class AuthenticationResponse
  {
    public string? Token { get; set; }
    public User? User { get; set; }
  }
}
```

## 18. Create a new file in the *Securing_WebAPI.web/Controllers/* directory called *AuthenticationController.cs*

This is the controller exposed as an API that will allow for the login

```csharp
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
```

# Testing the Backend Project

The following is a suggested way for testing the backend code. This will use the swagger site provided in
the default dotnet template and also PostMan. To peform the testing, PostMan must be installed.

## Copy the `Get()` method of the *WeatherForecastController.cs*

We will create 2 copies of this method.

1. Paste and rename the method `GetRestricted()`

```csharp
    [Authorize]
    [HttpGet("GetWeatherForecastRestricted")]
    public IEnumerable<WeatherForecast> GetRestricted()
    {
        return Enumerable.Range(1, 5).Select(index => new WeatherForecast
        {
            Date = DateTime.Now.AddDays(index),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = Summaries[Random.Shared.Next(Summaries.Length)]
        })
        .ToArray();
    }
```

Using the `[Authorize]` attribute will test that we are properly logged in when calling the method

2. Paste and rename the method `GetAdmin()`

```csharp
    [Authorize(Roles = "admin")]
    [HttpGet("GetWeatherForecastAdmin")]
    public IEnumerable<WeatherForecast> GetAdmin()
    {
        return Enumerable.Range(1, 5).Select(index => new WeatherForecast
        {
            Date = DateTime.Now.AddDays(index),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = Summaries[Random.Shared.Next(Summaries.Length)]
        })
        .ToArray();
    }
```

Using the `[Authorize(Roles = "admin")]` attribute will test that we are not only properly logged in 
when calling the method but that we also have the *admin* role

Because of the added code, specifically the use of the `[Authorize]` attribute, we need to add the 
following using statement to the *WeatherForecastController.cs* file:

```csharp
using Microsoft.AspNetCore.Authorization;
```

## Run the Service

if the service is not already running, execute the statement to run the service

```bash
dotnet watch run --project Securing_WebAPI.web/Securing_WebAPI.web.csproj
```

## Execute the *Authentication/Login*

user **Swagger** to execute the *Authentication/Login* Method by changing the body
of the call to have a valid username and password.

Valid username and password combinations are listed below  
- admin | password
- user | password

This can also be found in the *testdata.sql* file

A successful call will return a user object and token. Copy the token. 

## Open **PostMan** and Test

The previous step can be used to generate different tokens for different users by changing the username
and password. You can also use **Postman** directly for login as well as the test methods.

In **Postman** when trying to test when of the GetWeatherForecast methods be sure to add the token
to the Authentication tab as a *Bearer Token*

The urls for the methods to test would be similar to:
- http://localhost:7182/WeatherForecast/GetWeatherForecastRestricted
- http://localhost:7182/WeatherForecast/GetWeatherForecastAdmin

# Setting Up the Front-End

For the implementation of the front-end we need to get the No_SPA_Framework_Necessary solution. This can 
be found at the following link on Github. 

https://github.com/vjpudelski/IC22_No_SPA_Framework_Necessary

## 19. Create a *wwwroot* directory in the *Securing_WebAPI.web* project

This directory is used to hold static files that can be referenced without an additional folder. For 
instance the relative path of just `/index.html` will look in the *wwwroot* folder for an index.html 
file. 

## 20. Copy No_SPA_Framework_Necessary project into the */wwwroot/* directory

In the repository for the No_SPA_Framework_Necessary project you want to find the */project_finished/* 
directory. Copy all the files from that directory into the */wwwroot/* directory.

## 21. Add Default and Static files to the application at runtime

To do this we need to go into the *Program.cs* file and add the following lines:

```csharp
app.UseDefaultFiles();

app.UseStaticFiles();
```

These lines can be added just below the `app.UseHttpsRedirection()`.

Now you can launch the application and go to either of the following URLs to verify it is working:
- http://localhost:7182/#/
- http://localhost:7182/#/new/

## 22. Create a new file in the *Securing_WebAPI.web/wwwroot/scripts/* directory called *webapi.js*

This file will wrap the fetch API method. The purpose is to provide an easy to use interface for 
calling webAPI methods. 

Make sure the port number is the correct port for the url

```javascript
// path to the WebAPI facilitating the calls.
let url = 'https://localhost:7182';

class APIMethods {
  async execFetch(method, action, headers, data) {
    let message = {};

    // set the action > POST, GET, etc
    message.method = action;

    // assign the message headers
    if (headers) {
      message.headers = headers;
    }
    else {
      message.headers = {};
    }

    // set the message body for the call
    if (data) {
      message.body = JSON.stringify(data);
    }

    const response = await fetch(url + method, message);

    if (response.ok) {
      return (response.status != 204 ? response.json().catch(() => null) : null);
    } else {
      let error = await response.json();
      return Promise.reject({
        status: response.status,
        statusText: response.statusText,
        errorMessage: error.message
      });
    }
  }
  
  defaultHeaders = { 'Content-Type': 'application/json; charset=utf-8' };
}

let API = new APIMethods();
export default API;
```

## 23. Create a new file in the *Securing_WebAPI.web/wwwroot/scripts/* directory called *authentication.js*

This file will provide our client side authentication interface. The file will be able to tell if we 
are logged in or not and provide valuable information about the user logged in. 

```js
export default class Authentication {
  static #userKey = "user";
  static #tokenKey = "token";

  static login(user, token) {
    // store the items in the session storage
    sessionStorage.setItem(this.#userKey, JSON.stringify(user));
    sessionStorage.setItem(this.#tokenKey, JSON.stringify(token));
  }

  static logout() {
    // remove the items from session storage
    sessionStorage.removeItem(this.#userKey);
    sessionStorage.removeItem(this.#tokenKey);
  }
  
  static isAuthorized(roles) {
    var isAuthorized = false;

    // if roles is set to 'any', need only check if logged in
    if (roles.length == 1 && roles[0] == 'any') {
      isAuthorized = this.isLoggedIn();
    } else {
      // else if logged in see if the role matches any of the roles on the route
      if (this.isLoggedIn()) {
        isAuthorized = roles.some((r) => r == this.getUser().role);
      }
    }

    return isAuthorized;
  }
  
  static isLoggedIn() {
    // return if there is a user object
    let user = this.getUser();
    return (user != null);
  }

  static getUser() {
    // return the user object
    return JSON.parse(sessionStorage.getItem(this.#userKey));
  }

  static showAuth() {
    // get all elements with the proper tag
    let elements = document.querySelectorAll("[ic-auth]");

    // check if we are logged in
    let isAuth = this.isLoggedIn();

    // iterate the elements with the proper tag
    elements.forEach((el) => {
      // if tag is true and matches login state, show
      if ((el.getAttribute("ic-auth") == "true") == isAuth) {
        el.removeAttribute("hidden");
      } else {
        // else hide element
        el.setAttribute("hidden", "hidden");
      }
    });
  }

  static showAuthorize() {
    // get all the elements 
    var elements = document.querySelectorAll("[ic-authorize]");

    // if not logged in, hide elements
    if (!this.isLoggedIn()) {
      elements.forEach((el) => {
        el.setAttribute("hidden", "hidden");
      });
    } else { 
      // else get the user
      let user = this.getUser();
      elements.forEach((el) => {
        // get the value of the tag
        let value = el.getAttribute("ic-authorize");

        // if the value is blank or matches the user role show
        if (value == "" || user.role.includes(value)) {
          el.removeAttribute("hidden");
        } else {
          // hide the element
          el.setAttribute("hidden", "hidden");
        }
      });
    }
  }
}
```

# Login and Store Token

## 24. Create a new file in the *Securing_WebAPI.web/wwwroot/pages/* directory called *login.js*

This file is a page using a framework developed in another session. The pages or views of that 
framework are actually created use javascript files.

The reason for using such a simplistic framework is to emphasize what is happening at each step.

```js
import Auth from '../scripts/authentication.js';
import WebAPI from '../scripts/webapi.js';

const html = () => /*html*/`
<div>
  <form id="form-login">
    <h2>Login Page</h2>
    <div>
      <label for="text-user">UserName: </label>
      <input id="text-username" />
    </div>
    <div>
      <label for="text-input">Password: </label>
      <input id="text-password" type="password" />
    </div>
    <button>Login</button>
</div>
`;

export default class LoginPage {
  constructor() { }

  init() {
    document.querySelector('#form-login').addEventListener('submit', e => {
      e.preventDefault();
      this.login();
    });
  }

  render(params) {
    return html();
  }

  login() {
    let request = {
      userName: document.querySelector('#text-username').value,
      password: document.querySelector('#text-password').value
    };

    WebAPI.execFetch('/authentication/login', 'POST', WebAPI.defaultHeaders, request)
      .then(data => {
        Auth.login(data.user, data.token);
        window.location.href = '/#/welcome';
      });
  }
}
```

## 25. Create a new file in the *Securing_WebAPI.web/wwwroot/pages/* directory called *admin.js*

This page will be one that we will restrict to only allow admin users to browse.

```js
const html = () => /*html*/`
<div>
  <h2>Admin Page</h2>
</div>
`;

export default class AdminPage {
  constructor() { }

  init() { }

  render(params) {
    return html();
  }
}
```

## 26. Create a new file in the *Securing_WebAPI.web/wwwroot/pages/* directory called *welcome.js*

This page will be the page we go to directly upon loggin in. You must be logged in to see the page.

```js
const html = () => /*html*/`
<div>
  <h2>Welcome Page</h2>
  <p ic-authorize="admin">I am logged in as an admin</p>
  <p ic-authorize="public">I am logged in as a user</p>
</div>
`;

export default class WelcomePage {
  constructor() { }

  init() { }

  render(params) {
    return html();
  }
}
```

Note: we used the `[ic-authorize]` attribute to allow conditional display of the elements. The value of the 
tag provides what type of user will be able to see the element upon logging in.

## 27. Add a couple tags to the *Securing_WebAPI.web/wwwroot/pages/home.js* file

These elements go directly under the existing paragraph tag

```html
  <p ic-auth="true">You are logged in</p>
  <p ic-auth="false">You are NOT logged in</p>
```

Note: we have used the `[ic-auth]` attribute to allow conditional showing of elements

## 28. Next we need to add our routes to the *Securing_WebAPI.web/wwwroot/scripts/routes.js* fle.

Here we can add the routes to the end of the array. Make sure to add the comma after the last existing 
route in the file

```js
  },
  {
    path: "/login",
    component: new LoginPage()
  },
  {
    path: "/admin",
    component: new AdminPage(),
    authorize: "admin"
  },
  {
    path: "/welcome",
    component: new WelcomePage(),
    authorize: "any"
  }
```

For each of these routes we need to make sure the page components for each page are added to the top of 
the file for reference

```js
import LoginPage from '../pages/login.js';
import AdminPage from '../pages/admin.js';
import WelcomePage from '../pages/welcome.js';
```

## Modify the *Securing_WebAPI.web/wwwroot/scripts/router.js* file to include logic for authentication

at the top of the file include the reference to `Auth`.

```js
import Auth from './authentication.js';
```

Modify the `goToRoute(path)` method to include logic to check if the Route is accessible

```js
  goToRoute(path) {
    let nav = this.getRouteFromPath(path);

    let isAccessible = this.isRouteAccessible(nav);
    if (isAccessible) {
      this.rootElement.innerHTML = nav.route.component.render(nav.params);
      nav.route.component.init();
      Auth.showAuth();
      Auth.showAuthorize();
    } else {
      window.location.href = ((path != null || path == "/" || path == "/login") ? "" : "?redirect=" + path) + "#/login";
    }
  }
```

Add a method for checking if the Route is Accessible. This will contain the implementation of the 
previously mentioned check for if the Route is accessible.

```js
  // check if route is accessible to current user
  isRouteAccessible(nav) {
    let isAccessible = false;

    // if there is an authorize on the route, check permissions
    if (nav.route.authorize) {
      let roles = nav.route.authorize.split(",");
      isAccessible = Auth.isAuthorized(roles);
    } else {
      isAccessible = true;
    }

    return isAccessible;
  }  
```

# Testing the Solution

You can launch the web site and navigate the urls. Note the use of the '#' in the users. make sure as you try to go 
to different pages you include that. 

Here is a list of the available urls  
https://localhost:7135/#/  
https://localhost:7135/#/new/  
https://localhost:7135/#/login/  
https://localhost:7135/#/admin/  
https://localhost:7135/#/welcome/  
