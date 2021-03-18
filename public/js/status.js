document.addEventListener('DOMContentLoaded', initStatus, false);
function initStatus() {
  if (!navigator.onLine) {
    const statusElem = document.querySelector('.page-status')
    statusElem.innerHTML = 'offline'
  }
}