const vscode = acquireVsCodeApi();
const logDiv = document.getElementById('log');
const input = document.getElementById('input');

function appendLog(log) {
  logDiv.innerHTML = '';
  log.forEach(line => {
    const div = document.createElement('div');
    div.textContent = line;
    logDiv.appendChild(div);
  });
  logDiv.scrollTop = logDiv.scrollHeight;
}

window.addEventListener('message', event => {
  const message = event.data;
  if (message.type === 'log') {
    appendLog(message.log);
  }
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const value = input.value.trim();
    if (value) {
      vscode.postMessage({ type: 'command', text: value });
      input.value = '';
    }
  }
}); 