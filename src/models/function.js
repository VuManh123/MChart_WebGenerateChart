function showOptions(event, projectID) {
    event.preventDefault();
    event.stopPropagation();
    closeAllPopups();

    var popup = document.getElementById(`popupProject-${projectID}`);
    popup.style.display = "block";
}

function closeAllPopups() {
    var popups = document.querySelectorAll('.popupProject');
    popups.forEach(function(popup) {
        popup.style.display = "none";
    });
}

// Các hàm xử lý chức năng như renameProject, shareProject, removeProject, viewFileInfo có thể được triển khai ở đây
function renameProject(projectID) {
    var newProjectName = prompt('Enter the new name for the project:');
    
    if (newProjectName !== null && newProjectName !== '') {
        fetch('http://localhost:5000/updateNameProject', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectID: projectID,
                projectNewName: newProjectName,
            }),
        })
        .then(response => response.json())
        .then(function(result) {
            if (result.success) {
                // Update the project name in the UI
                var projectElement = document.querySelector(`.project-item[data-project-id="${projectID}"] .project-name`);
                projectElement.textContent = newProjectName;

                alert(result.message);
            } else {
                alert('Error updating project name. Please try again.');
            }
        })
        .catch(function(error) {
            console.error('Error updating project name:', error);
            alert('An error occurred while updating the project name.');
        });
    }
    else {
        alert('The new name of project is empty. Update fail!')
    }
}

async function shareProject(projectID) {
    // Define roles for the combobox
    const roles = ['view', 'edit'];

    // Show a custom dialog for input
    const dialogHtml = `
        <div class="label-container">
            <label for="role">Select Role:</label>
            <select id="role">${roles.map(role => `<option value="${role}">${role}</option>`).join('')}</select>
        </div>
        <div class="label-container">
            <label for="email">Enter Email:</label>
            <input type="text" id="email" />
        </div>
    `;

    const result = await showModalDialog('Share Project', dialogHtml);

    if (result) {
        const { role, email } = result;
        try {
            const response = await fetch('http://localhost:5000/shareProject', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: role,
                    emailUser: email,
                    projectID: projectID,
                }),
            });

            const data = await response.json();

            if (data.success) {
                alert('Share project successfully!');
            } else {
                alert('Error sharing project: ' + data.message);
            }
        } catch (error) {
            console.error('Error sharing project:', error);
            alert('An error occurred while sharing project.');
        }
    }
}

// Helper function for displaying a custom modal dialog
function showModalDialog(title, content) {
    return new Promise(resolve => {
        const dialog = document.createElement('div');
        dialog.innerHTML = `
            <div class="modal-container">
                <div class="modal-content">
                    <h2>${title}</h2>
                    ${content}
                    <div class="button-container">
                        <button id="confirmBtn" class="button-save">OK</button>
                        <button id="cancelBtn" class="button-save">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const confirmBtn = dialog.querySelector('#confirmBtn');
        const cancelBtn = dialog.querySelector('#cancelBtn');

        confirmBtn.addEventListener('click', () => {
            const role = dialog.querySelector('#role').value;
            const email = dialog.querySelector('#email').value;
            resolve({ role, email });
            document.body.removeChild(dialog);
        });

        cancelBtn.addEventListener('click', () => {
            resolve(null);
            document.body.removeChild(dialog);
        });
    });
}

function confirmAndRemoveProject(projectID) {
    const isConfirmed = window.confirm('Are you sure you want to delete this project?');

    if (isConfirmed) {
        removeProject(projectID);
    }
}
function removeProject(projectID) {
    fetch('http://localhost:5000/removeProject', {
        method: 'POST', // Use POST method
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectID: projectID }), // Include projectID in the request body
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(function(result) {
        if (result.success) {
            alert(result.message);
        } else {
            alert(result.message);
        }
    })
    .catch(function(error) {
        console.error('Error removing project:', error);
        alert('An error occurred while removing the project.');
    });
}

function viewFileInfo(projectID) {
    fetch('http://localhost:5000/listInfoProject', {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectID: projectID }), // Include projectID in the request body if needed
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    
    .then(function(projectInfo) {
        alert(`Project Name: ${projectInfo[0].ProjectName}\nDescription: ${projectInfo[0].Description}\nCreate Date: ${projectInfo[0].CreateAt}\nCheckpoint: ${projectInfo[0].CheckpointDescription} at time: ${projectInfo[0].CheckpointDate}`);
    })
    .catch(function(error) {
        console.error('Error fetching project information:', error);
        alert('An error occurred while fetching project information.');
    });
}

function handleFileUpload() {
    // Trigger the click event on the file input element
    document.getElementById('file-input').click();
}

function handleFileChange(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];

    if (file) {
        // Read the contents of the file
        const reader = new FileReader();
        reader.onload = function (e) {
            const fileContent = e.target.result;

            // Parse the JSON content (assuming it's a JSON file)
            try {
                const jsonData = JSON.parse(fileContent);

                // Update the form fields with information from the JSON file
                document.getElementById('chart-name').value = jsonData.chartName || '';
                document.getElementById('chart-type').value = jsonData.chartType || '';
                document.getElementById('data-input').value = jsonData.data ? jsonData.data.join(', ') : '';
                document.getElementById('label-input').value = jsonData.labels ? jsonData.labels.join(', ') : '';
            } catch (error) {
                console.error('Error parsing JSON:', error);
                // Handle parsing error if needed
            }
        };
        reader.readAsText(file);
    }
}

