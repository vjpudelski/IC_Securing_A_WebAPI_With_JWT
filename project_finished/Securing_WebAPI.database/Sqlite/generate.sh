# DELETE previous database
echo "cleaning up existing db..."
rm ../../securing_webapi.web/data/jwt_db.sqlite

# CREATE database
echo "creating database tables"
sqlite3 ../../securing_webapi.web/data/jwt_db.sqlite < createdb.sql

# INSERT SAMPLE DATA
echo "inserting test data"
sqlite3 ../../securing_webapi.web/data/jwt_db.sqlite < testdata.sql
