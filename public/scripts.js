document.addEventListener('DOMContentLoaded', () => {
    const user_id = promtuserid();
    // Call the function to set up the form
    setupExpenseForm();

    // change table 
    toggleExpenseForm();

    fetchAndDisplayExpenses(user_id);

    fetchExpensesToPay(user_id);  // Replace with the actual user ID

    // Call this function with the actual userId when needed
    fetchExpensesToGet(user_id);  // Replace with the actual user ID


});

// --------------------------------------------------------------------------------------------------------------

// form handling

function toggleExpenseForm() {
    const expenseTypeSelection = document.getElementById('expense-type-selection');
    expenseTypeSelection.addEventListener('change', toggleExpenseForm);
    const ownExpenseFields = document.getElementById('ownExpenseFields');
    const splitToPayerFields = document.getElementById('splitToPayerFields');

    if (document.getElementById('simple-expense').checked) {
        ownExpenseFields.style.display = 'block';
        splitToPayerFields.style.display = 'none';
    } else {
        ownExpenseFields.style.display = 'none';
        splitToPayerFields.style.display = 'block';

    }
}

function setupExpenseForm() {

    document.getElementById('expenseForm').addEventListener('submit', async function (event) {
        event.preventDefault();

        const expenseType = document.querySelector('input[name="expenseType"]:checked').value;
        console.log(expenseType);
        if (expenseType === 'ownExpense') {
            const amount = document.getElementById('amount').value;
            const description = document.getElementById('description').value;
            console.log(amount, description);
            // Call the API to add own expense
            const response = await addOwnExpense({ amount, description });
            console.log("Responce: ", response);
            if (response) {
                const responseData = await response.json();
                const { expensesId } = responseData;
                console.log('Own Expense added successfully. Expense ID:', expensesId);
            }
        }
        else if (expenseType === 'splitToPayer') {
            const amount = document.getElementById('splitAmount').value;
            const payer = document.getElementById('payer').value;
            const description = document.getElementById('splitDescription').value;
            console.log(amount)
            console.log(description)


            try {
                const response = await addOwnExpense({ amount, description });
                console.log("Responce: ", response);
                if (response) {
                    const responseData = await response.json();
                    const { expensesId } = responseData;
                    console.log('Own Expense added successfully. Expense ID:', expensesId);
                    let splitAmount = amount / 2;
                    // Call the API to add split to payer
                    addSplitToPayer({ payer, splitAmount, expensesId });
                }

                else {
                    console.error('Failed to add own expense.');
                    // Handle error if needed
                }
            } catch (error) {
                console.error('Error adding own expense:', error);
            }

        }

        // Clear the form fields or perform any other necessary actions
        this.reset();
    });
}

async function addOwnExpense(data) {
    try {
        const response = await fetch('/addexpenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: 1, // Replace with the actual user ID
                amount: data.amount,
                description: data.description,
            }),
        });

        if (response.ok) {
            console.log('Own Expense added successfully.');
            // Handle success if needed
        } else {
            console.error('Failed to add own expense.');
            // Handle error if needed
        }
        return response;
    } catch (error) {
        console.error('Error adding own expense:', error);
    }
}

async function addSplitToPayer(data) {
    try {
        const response = await fetch('/addSplitToPayer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                payerId: data.payer,
                payeeId: 1, // Replace with the actual user ID
                amount: data.splitAmount,
                expenseId: data.expensesId, // Include expensesId in the request
            }),
        });

        if (response.ok) {
            console.log('Split to Payer added successfully.');
            // Handle success if needed
        } else {
            console.error('Failed to add Split to Payer.');
            // Handle error if needed
        }
    } catch (error) {
        console.error('Error adding Split to Payer:', error);
    }
}


/*----------------------------------------------------------------------------------------------------------*/

// fetching expenses that user have to pay to another users

async function fetchExpensesToPay(userId) {
    await fetch(`/expenses/to-pay/${userId}`)
        .then(response => response.json())
        .then(data => {
            displayExpensesToPay(data);
        })
        .catch(error => {
            console.error('Error fetching expenses to pay:', error);
        });
}

function displayExpensesToPay(expensesToPay) {
    const tableBody = document.getElementById('user-to-pay-expenses').getElementsByTagName('tbody')[0];

    // Clear existing table rows
    tableBody.innerHTML = '';

    // Populate the table with expenses data
    expensesToPay.forEach(expense => {
        const row = tableBody.insertRow();
        const dateCell = row.insertCell(0);
        const descriptionCell = row.insertCell(1);
        const amountCell = row.insertCell(2);
        const payto = row.insertCell(3);
        const settleCell = row.insertCell(4);  // New cell for the settle button

        // Assuming there is a 'date', 'description', 'amount', 'payee_name', and 'split_id' property in the API response
        dateCell.textContent = new Date(expense.expense_date).toLocaleDateString(); // Replace with actual date property from API response
        descriptionCell.textContent = expense.description;  // Replace with actual description property from API response
        amountCell.textContent = expense.amount;  // Replace with actual amount property from API response
        payto.textContent = expense.payee_name;

        // Create a button for settling the expense
        const settleButton = document.createElement('button');
        settleButton.textContent = 'SettleUp';
        settleButton.addEventListener('click', () => handleSettleButtonClick(expense.split_id));

        // Append the button to the settleCell
        settleCell.appendChild(settleButton);
    });
}

async function handleSettleButtonClick(splitId) {
    console.log(`Settle button clicked for split ID: ${splitId}`);
    try {
        const response = await fetch(`/settle-expense/${splitId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            console.log('Expense settled successfully.');
            window.location.reload();
        } else {
            console.error('Failed to settle expense.');
            // Handle error if needed
        }
    } catch (error) {
        console.error('Error settling expense:', error);
    }
}


/*----------------------------------------------------------------------------------------------------------*/

// fetching expenses that user have to get from another users

function fetchExpensesToGet(userId) {
    fetch(`/expenses/to-get/${userId}`)
        .then(response => response.json())
        .then(data => {
            displayExpensesToGet(data);
        })
        .catch(error => {
            console.error('Error fetching expenses to get:', error);
        });
}

function displayExpensesToGet(expensesToGet) {
    const tableBody = document.getElementById('user-to-get-expenses').getElementsByTagName('tbody')[0];

    // Clear existing table rows
    tableBody.innerHTML = '';

    // Populate the table with expenses data
    expensesToGet.forEach(expense => {
        const row = tableBody.insertRow();
        const dateCell = row.insertCell(0);
        const descriptionCell = row.insertCell(1);
        const payeeCell = row.insertCell(2);
        const amountCell = row.insertCell(3);

        // Assuming there is a 'date', 'payer_name', 'payee_name', and 'amount' property in the API response
        dateCell.textContent = new Date(expense.expense_date).toLocaleDateString();  // Replace with actual date property from API response
        descriptionCell.textContent = expense.description;  // Replace with actual payer_name property from API response
        payeeCell.textContent = expense.amount;  // Replace with actual payee_name property from API response
        amountCell.textContent = expense.payer_name;  // Replace with actual amount property from API response
    });
}


/*----------------------------------------------------------------------------------------------------------*/

// fetch user Expenses with their id

async function fetchAndDisplayExpenses(userId) {
    try {
        const response = await fetch(`/expenses/${userId}`);
        if (response.ok) {
            const expenses = await response.json();
            displayExpenses(expenses);
        } else {
            console.error('Failed to fetch expenses.');
        }
    } catch (error) {
        console.error('Error fetching expenses:', error);
    }
}

// Function to display expenses in the table

function displayExpenses(expenses) {
    const tableBody = document.querySelector('#current-user-expenses tbody');
    tableBody.innerHTML = ''; // Clear existing table rows

    expenses.forEach((expense) => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = new Date(expense.date).toLocaleDateString();
        row.insertCell(1).textContent = expense.description;
        const amountCell = row.insertCell(2);
        const amountValue = Number(expense.amount);

        if (!isNaN(amountValue)) {
            amountCell.textContent = `$${amountValue.toFixed(2)}`;
        } else {
            amountCell.textContent = 'Invalid Amount';
        }

        // Add a button in the last column
        const button = document.createElement('button');
        button.textContent = 'Delete';
        button.id = `settleButton_${expense.expense_id}`;
        button.addEventListener('click', () => handleDeleteButtonClick(expense.expense_id));
        row.insertCell(3).appendChild(button);
    });
}

// Function to handle the button click (replace with your actual logic)
function handleDeleteButtonClick(expenseId) {
    // Example: Log the expense ID when the button is clicked
    console.log(`Delete button clicked for expense ID: ${expenseId}`);

    // Make a DELETE request to the API to delete the expense
    fetch(`/expenses/${expenseId}`, {
        method: 'DELETE',
    })
        .then(response => {
            if (response.ok) {
                console.log('Expense and associated splits deleted successfully.');
                // Optionally update the UI or perform other actions upon successful deletion
                window.location.reload();
            } else {
                console.error('Failed to delete expense and associated splits.');
                // Handle error if needed
            }
        })
        .catch(error => {
            console.error('Error deleting expense and associated splits:', error);
        });
}

function promtuserid() {
    const storedUserId = localStorage.getItem('user_id');
    let user_id = storedUserId;
    if (storedUserId) {
        // If user_id is already stored, use it
        handleUserLoad(storedUserId);
    } else {
        // If user_id is not stored, prompt the user to enter it
        const user_id = prompt('Enter your user_id:');

        if (user_id) {
            // If the user provides user_id, store it in localStorage
            localStorage.setItem('user_id', user_id);

            // Call the function to handle user load
            window.location.reload();

            handleUserLoad(user_id);

        } else {
            // Handle the case when the user cancels the prompt
            alert('User_id is required. Please reload the page and enter your user_id.');
        }
    }
    console.log('User Id:', user_id);

    return user_id;
}

function handleUserLoad(user_id) {

    console.log('User loaded with user_id:', user_id);

}

function handleLogout() {
    // Remove user_id from localStorage
    localStorage.removeItem('user_id');
    // Optionally, perform any other logout-related actions
    // For example, redirect the user to the login page
    window.location.reload();
}

