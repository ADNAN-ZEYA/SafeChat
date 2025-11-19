# database.py
import mysql.connector
from mysql.connector import Error

def get_db_connection():
    """Creates and returns a connection to the MySQL database."""
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',  # Or your MySQL username if it's different
            password=' ', # <-- IMPORTANT: REPLACE THIS
            database='safechat_db'
        )
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Error connecting to MySQL Database: {e}")
        return None
