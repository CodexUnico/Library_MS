const BASE_URL = 'http://localhost:5000';

// Page-specific row templates
const userRowTemplate = (user) => `
    <tr>
        <td>${user.user_id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.phone}</td>
        <td>${user.address}</td>
        <td>${user.registration_date}</td>
        <td><span class="status ${user.status.toLowerCase()}">${user.status}</span></td>
        <td>
            <button class="edit-btn" onclick="editUser('${user.user_id}')">Edit</button>
        </td>
    </tr>
`;

const bookRowTemplate = (book) => `
    <tr>
        <td>${book.book_id}</td>
        <td>${book.title}</td>
        <td>${book.author_name}</td>
        <td>${book.genre}</td>
        <td>${book.publication_year}</td>
        <td>${book.copies_total}</td>
        <td>${book.copies_available}</td>
        <td>Status</td>
         <td>
            <button class="edit-btn" onclick="editBook('${book.book_id}')">Edit</button>
        </td>
    </tr>
`;

const borrowingRowTemplate = (borrowing) => `
    <tr>
        <td>${borrowing.borrowing_id}</td>
        <td>${borrowing.user_id}</td>
        <td>${borrowing.user_name || '-'}</td>
        <td>${borrowing.book_id}</td>
        <td>${borrowing.book_title || '-'}</td>
        <td>${borrowing.borrowed_date}</td>
        <td>${borrowing.due_date}</td>
        <td>${borrowing.returned_date || '-'}</td>
        <td><span class="status-badge ${(borrowing.status ?? '').toLowerCase()}"> ${borrowing.status}</span></td>
        <td>$${borrowing.fine_amount || '0.00'}</td>
       <td>
            ${borrowing.status != 'returned' ? 
                `<button class="action-btn" onclick="returnBook('${borrowing.borrowing_id}')">Return Book</button>` : ''} 
        </td>
    </tr>
`;

const fineRowTemplate = (fine) => `
    <tr>
        <td>${fine.fine_id}</td>
        <td>${fine.user_id}</td>
        <td>${fine.user_name || '-'}</td>
        <td>${fine.borrowing_id}</td>
        <td>$${fine.fine_amount}</td>
        <td>${fine.reason}</td>
        <td>${fine.issued_date}</td>
        <td>${fine.paid_date || '-'}</td>
        <td><span class="status-badge ${fine.status}">${fine.status}</span></td>
        <td>
            ${(fine.status == 'unpaid' || !fine.status) ? 
                `<button class="action-btn" onclick="finePaid('${fine.fine_id}')">Mark as Paid</button>` : ''
            }
        </td>
    </tr>
`;


//Utility functions

function mergeSort(arr, key) {
    if (arr.length <= 1) return arr;

    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid), key);
    const right = mergeSort(arr.slice(mid), key);

    return merge(left, right, key);
}

function merge(left, right, key) {
    let result = [];
    let i = 0, j = 0;

    while (i < left.length && j < right.length) {
        let leftVal = String(left[i][key]).toLowerCase();
        let rightVal = String(right[j][key]).toLowerCase();

        if (leftVal <= rightVal) {
            result.push(left[i]);
            i++;
        } else {
            result.push(right[j]);
            j++;
        }
    }

    return result.concat(left.slice(i)).concat(right.slice(j));
}

async function fetchData(routeEP){
    try{
        const response = await fetch(`${BASE_URL}${routeEP}`);
        const data = await response.json();
        return data;
    } catch(err){
        console.error(`error loading ${routeEP}: `, err);
    }
}

async function displayTableData(routeEP, tbodyId, rowTemplate, sortKey = null){
    const tbody = document.getElementById(tbodyId);
    if(!tbody) return;

    tbody.innerHTML = ''; // Clear existing data

    let data = await fetchData(routeEP);

    if(sortKey){
        data = mergeSort(data, sortKey);
    }

    data.forEach(item => {
        tbody.innerHTML += rowTemplate(item);
    });
}


// Modal Functions
function openModal(modal) {
    modal.style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

//------------Data Display (read operations)----------------
// Display data based on page
if(document.getElementById('usersTableBody')){
    displayTableData("/users", 'usersTableBody', userRowTemplate, "name")
}
if(document.getElementById('booksTableBody')){
    displayTableData("/books", 'booksTableBody', bookRowTemplate, "title")
}
if(document.getElementById('borrowingsTableBody')){
    displayTableData("/borrowings", 'borrowingsTableBody', borrowingRowTemplate)
}
if(document.getElementById('finesTableBody')){
    displayTableData("/fines", 'finesTableBody', fineRowTemplate, "fine_amount");
}


//------------Update/edit & delete operations----------------


//return book
async function returnBook(borrowingId){
    try{
        response = await fetch(`${BASE_URL}/borrowings/return/${borrowingId}`,
            {method: 'PUT'}
        );
        const result = await response.json();
        console.log(result.message);

        // Refresh borrowings table
        displayTableData("/borrowings", 'borrowingsTableBody', borrowingRowTemplate);
    } catch (err){
        console.error(`Error occured while returning ${borrowingId}:`, err)
    }
}

//Pay fine
async function finePaid(fineId){
    try{
        response = await fetch(`${BASE_URL}/fines/pay/${fineId}`,
            {method: 'PUT'}
        );

        const result = await response.json();
        console.log(result.message);

        // Refresh fines table
        displayTableData("/fines", 'finesTableBody', fineRowTemplate, "fine_amount");

    } catch (err){
        console.error(`Error occured while marking ${fineId}:`, err)
    }
}


//------------Modal Handling (create operations)----------------
// Get userModal elements
const userModal = document.getElementById('addUserModal');
const userForm = document.getElementById('addUserForm');
const openUFbtn = document.getElementById('openAddUserModal');
const closeUFbtn = document.getElementById('closeAddUserModal');
const cancelUFbtn = document.getElementById('cancelAddUser');

// Only run if we're on the users page (all elements exist)
if (userModal && openUFbtn && userForm) {
    // Open userModal
    openUFbtn.onclick = function () {
        openModal(userModal);
    }

    // Close userModal
    closeUFbtn.onclick = function () {
        closeModal(userModal);
        userForm.reset();
    }

    cancelUFbtn.onclick = function () {
        closeModal(userModal);
        userForm.reset();
    }

    // Handle userForm submission
    // e is of type Event
    userForm.onsubmit = async function (e) {
        e.preventDefault();

        // Get userForm data
        const formData = new FormData(userForm);
        const userData = {};
        formData.forEach((value, key) => {
            userData[key] = value;
        });

        //sending to server
        try{
            const response = await fetch(`${BASE_URL}/users/add`, {
                method: 'POST', 
                headers: {"content-Type": 'application/json'},
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            console.log(result.message);

        }catch (err){
            console.error('Error adding user:', err);
        }

        closeModal(userModal);
        userForm.reset();
        displayTableData("/users", 'usersTableBody', userRowTemplate)
    }
}
// Get bookModal elements
const bookModal = document.getElementById('addBookModal');
const bookForm = document.getElementById('addBookForm');
const openBFbtn = document.getElementById('addBookBtn');
const closeBFbtn = document.getElementById('closeAddBookModal');
const cancelBFbtn = document.getElementById('cancelAddBook');

// Only run if we're on the books page
if (openBFbtn && bookModal && bookForm) {
    // Open bookModal
    openBFbtn.onclick = function () {
        openModal(bookModal);
    }

    //close bookModal
    closeBFbtn.onclick = function () {
        closeModal(bookModal);
        bookForm.reset();
    }
    cancelBFbtn.onclick = function () {
        closeModal(bookModal);
        bookForm.reset();
    }

    // Handle bookForm submission
    bookForm.onsubmit = async function (e) {
        e.preventDefault();
        // Get bookForm data
        const formData = new FormData(bookForm);
        const bookData = {};
        formData.forEach((value, key) => {
            bookData[key] = value;
        });
        
        try {
            const response = await fetch(`${BASE_URL}/books/add`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(bookData)
            });

            const result = await response.json();
            console.log(result.message);

        } catch (err) {
            console.error('Error adding book:', err);
        }

        closeModal(bookModal);
        bookForm.reset();
        displayTableData("/books", 'booksTableBody', bookRowTemplate)
    }

}

// Get Issuing book elements
const issueModal = document.getElementById('issueBookModal');
const issueForm = document.getElementById('issueBookForm');
const openIBbtn = document.getElementById('issueBookBtn');
const closeIbbtn = document.getElementById('closeIssueBookModal');
const cancelIBbtn = document.getElementById('cancelIssueBook');

// Only run if we're on the borrowings page
if (openIBbtn && issueModal) {
    // Open issueModal
    openIBbtn.onclick = function () {
        openModal(issueModal);
    }

    // Close issueModal
    closeIbbtn.onclick = function () {
        closeModal(issueModal);
        issueForm.reset();
    }

    cancelIBbtn.onclick = function () {
        closeModal(issueModal);
        issueForm.reset();
    }

    // Handle issueForm submission (demo - just logs data)
    issueForm.onsubmit = async function (e) {
        e.preventDefault();
        // Get issueForm data
        const formData = new FormData(issueForm);
        const issueData = {};
        formData.forEach((value, key) => {
            issueData[key] = value;
        });

        try{
            const response = await fetch(`${BASE_URL}/borrowings/add`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(issueData)
            });

            const result = await response.json();
            console.log(result.message);
        }catch (err){
            console.error('Error issuing book:', err);
        }

        closeModal(issueModal);
        issueForm.reset();
        displayTableData("/borrowings", 'borrowingsTableBody', borrowingRowTemplate)
    }
}

// get fineModal elements
const fineModal = document.getElementById('addFineModal');
const fineForm = document.getElementById('addFineForm');
const openAFbtn = document.getElementById('addFineBtn');
const closeAFbtn = document.getElementById('closeAddFineModal');
const cancelAFbtn = document.getElementById('cancelAddFine');

// Only run if we're on the fines page
if (openAFbtn && fineModal) {
    // Open fineModal
    openAFbtn.onclick = function () {
        openModal(fineModal);
    }
    // Close fineModal
    closeAFbtn.onclick = function () {
        closeModal(fineModal);
        fineForm.reset();
    }
    cancelAFbtn.onclick = function () {
        closeModal(fineModal);
        fineForm.reset();
    }
    // Handle fineForm submission
    fineForm.onsubmit = async function (e) {
        e.preventDefault();
        // Get fineForm data
        const formData = new FormData(fineForm);
        const fineData = {};
        formData.forEach((value, key) => {
            fineData[key] = value;
        });

        try{
            const response = await fetch(`${BASE_URL}/fines/add`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(fineData)
            });
            const result = await response.json();
            console.log(result.message);

        }catch (err){
            console.error('Error adding fine:', err);
            alert('Error adding fine. Please try again. ', err);
        }

        closeModal(fineModal);
        fineForm.reset();
        displayTableData("/fines", 'finesTableBody', fineRowTemplate)
    }

}

// Close Modals when clicking outside
window.onclick = function (event) {

    if (event.target == userModal) {
        closeModal(userModal);
        userForm.reset();
    }

    if (event.target == bookModal) {
        closeModal(bookModal);
        bookForm.reset();
    }

    if (event.target == issueModal) {
        closeModal(issueModal);
        issueForm.reset();
    }

    if (event.target == fineModal) {
        closeModal(fineModal);
        fineForm.reset();
    }
}