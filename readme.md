# Expenses Tracker

Expenses Tracker is a web application that helps users manage their expenses. The application is built using Node.js, Express.js, PostgreSQL, HTML, CSS, and JavaScript.

## Getting Started

1. **Clone the repository:**

   ```bash
   git clone [repository_link]
   cd Expenses_tracker
   ```

2. **Install Node.js modules:**

   ```bash
   npm install
   ```

3. **Start the server:**

   ```bash
   npm start
   ```

4. **Open the application in your browser:**

   ```bash
   http://localhost:3000
   ```

## Features

- View user details and expenses.
- Add own expenses and split expenses with others.
- View expenses to get from other users.
- View expenses to pay to other users.
- Settle up expenses.
- Delete expenses.

## API Calls

1. **Get User Name:**
   - Endpoint: `/user/:userId`

2. **Get Expenses:**
   - Endpoint: `/expenses/:userId`

3. **Get Expenses to Get:**
   - Endpoint: `/expenses/to-get/:userId`

4. **Get Expenses to Pay:**
   - Endpoint: `/expenses/to-pay/:userId`

5. **POST Add Expenses:**
   - Endpoint: `/addexpenses`

6. **POST Add Split to Payer:**
   - Endpoint: `/addSplitToPayer`

7. **Settle Up Expenses:**
   - Endpoint: `/settle-expense/:splitId`

8. **Delete Expenses:**
   - Endpoint: `/expenses/:expenseId`

## Usage

1. When the server is started, the user is prompted to enter their `user_id`.
2. Based on the `user_id`, the expenses details are displayed.
3. The user can add own expenses or split expenses with others.
4. Expenses can be settled up, and individual expenses can be deleted.


## Database Setup

- PostgreSQL is used for the database. To set up the database, follow these steps:

  1. **Create Database:**
     - Run the PostgreSQL script provided in `database.sql`.

  2. **Database Configuration:**
     - Update the database configuration in `server.js`:
       ```javascript
       const pool = new Pool({
           user: 'your_db_user',
           host: 'localhost',
           database: 'your_db_name',
           password: 'your_db_password',
           port: 5432,
       });
       ```
       Replace `'your_db_user'`, `'your_db_name'`, and `'your_db_password'` with your database credentials.

## ChatGpt promt that used

```bash
   https://chat.openai.com/share/bd6f6a51-0fb1-4b28-be2e-a803616f2350
 ```


