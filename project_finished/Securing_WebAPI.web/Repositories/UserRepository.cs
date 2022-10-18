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