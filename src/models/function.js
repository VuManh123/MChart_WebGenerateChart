function showOptions(event, projectID) {
    // Ngăn chặn sự kiện mặc định của thẻ a
    event.preventDefault();
    closeAllPopups();
    var isInsidePopup = event.target.closest(`.popupProject-${projectID}`);

    // If the clicked element is not inside any popupProject, close all popups
    if (!isInsidePopup) {
        closeAllPopups();
    }

    // Hiển thị pop-up tương ứng với projectID
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
    // Xử lý chức năng đổi tên dự án
}

function shareProject(projectID) {
    // Xử lý chức năng chia sẻ dự án
}

function removeProject(projectID) {
    // Xử lý chức năng xóa dự án
}

function viewFileInfo(projectID) {
    // Xử lý chức năng xem thông tin file
}
