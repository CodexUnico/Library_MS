from flask import Flask, request, jsonify
from db import get_db_connection
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return jsonify({"message": "Library API running"})

# -------- USERS ENDPOINT --------
@app.route("/users", methods=["GET"])
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM Users")
    result = cursor.fetchall()
    print(result[0])

    cursor.close()
    conn.close()

    return jsonify(result)

@app.route("/users/add", methods=["POST"])
def add_user():
    data = request.json
    uId = data.get("userId")
    name = data.get("userName")
    email = data.get("userEmail")
    phone = data.get("userPhone")
    address = data.get("userAddress")
    regDate = data.get("registrationDate")
    status = data.get("userStatus")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "INSERT INTO users  VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (uId, name, email, phone, address, regDate, status)
    )
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "User added successfully"})

# --------------Books Endpoint
@app.route("/books", methods=["GET"])
def get_books():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary = True)

    cursor.execute("SELECT * from books")
    result = cursor.fetchall()
    print(result[0])

    cursor.close()
    conn.close()

    return jsonify(result)


@app.route("/books/add", methods = ["POST"])
def add_book():
    data = request.json
    bookId = data.get("bookId")
    title = data.get("bookTitle")
    author = data.get("author")
    genre = data.get("genre")
    pYear = data.get("pubYear")
    copiesTotal = data.get("copiesTotal")
    copiesAvl = data.get("copiesAvailable")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "INSERT INTO books (book_id, title, author_name, publication_year, genre, copies_total, copies_available) VALUES (%s,%s,%s,%s,%s,%s,%s)",
    (bookId, title, author, pYear, genre, copiesTotal, copiesAvl)
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "book added successfully"})



#---------Borrowings
@app.route("/borrowings", methods = ["GET"])
def get_borowings():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM borrowings")
    result = cursor.fetchall()
    print(result[0])

    cursor.close()
    conn.close()

    return jsonify(result)


@app.route("/borrowings/add", methods=["POST"])
def add_borrowings():
    data = request.json
    # Extract variables
    borrowing_id = data.get("borrowingId")
    user_id = data.get("userId")
    book_id = data.get("bookId")
    borrowed_date = data.get("borrowedDate")
    due_date = data.get("dueDate")
    returned_date = data.get("returnedDate") or None
    status = data.get("status")
    fine_amount = data.get("fineAmount") or None

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
         "INSERT INTO borrowings (borrowing_id, user_id, book_id, borrowed_date, due_date, returned_date, status, fine_amount) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
        (borrowing_id, user_id, book_id, borrowed_date, due_date, returned_date, status, fine_amount)
        )
    except Exception as e:
        conn.rollback()  # ✅ Rollback on error
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()  # ✅ Always close
        conn.close()

    return jsonify({"message": "borrowing added successfuly"})


#---------Fines
@app.route("/fines", methods= ["GET"])
def get_fines():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM fines")
    result = cursor.fetchall()
    print(result[0])

    cursor.close()
    conn.close()

    return jsonify(result)

@app.route("/fines/add", methods=["POST"])
def add_fines():
    data = request.json
    # Extract variables
    fine_id = data.get("fineId")
    user_id = data.get("userId")
    borrowing_id = data.get("borrowingId")
    fine_amount = data.get("fineAmount")
    reason = data.get("reason") 
    issued_date = data.get("issuedDate")
    paid_date = data.get("paidDate") or None
    status = data.get("status") 

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "INSERT INTO fines (fine_id, user_id, borrowing_id, fine_amount, reason, issued_date, paid_date, status) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
        (fine_id, user_id, borrowing_id, fine_amount, reason, issued_date, paid_date, status)
        )

    except Exception as e:
        conn.rollback()  # ✅ Rollback on error
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()  # ✅ Always close
        conn.close()

    return jsonify({"message": "fine added successfully"})



if __name__ == "__main__":
    app.run(debug=True)
