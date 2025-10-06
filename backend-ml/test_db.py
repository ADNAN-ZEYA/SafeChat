# test_db.py
import mysql.connector
from mysql.connector import Error

# --- IMPORTANT: PUT YOUR MYSQL PASSWORD HERE ---
# Use the EXACT same password you use for MySQL Workbench.
# Make sure it is inside the single quotes.

MY_PASSWORD = 'your_mysql_password' 

# ----------------------------------------------

print("Attempting to connect to MySQL...")

try:
    # Try to connect using the credentials
    connection = mysql.connector.connect(
        host='localhost',
        user='root',
        password=MY_PASSWORD,
        database='safechat_db'
    )

    if connection.is_connected():
        print("\n" + "="*30)
        print("  SUCCESS! ✅")
        print("  Database connection is working correctly.")
        print("="*30)
        connection.close()

except Error as e:
    # If it fails, print the specific error
    print("\n" + "!"*30)
    print("  CONNECTION FAILED! ❌")
    print(f"  The error is: {e}")
    print("  This confirms the password in this script is incorrect.")
    print("!"*30)