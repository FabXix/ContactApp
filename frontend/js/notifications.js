// ─── NOTIFICACIONES ───
export function showNotification(message, type = "success") {
  const containerId = "notification-container";
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.right = "20px";
    container.style.zIndex = 9999;
    document.body.appendChild(container);
  }

  const notif = document.createElement("div");
  notif.textContent = message;
  notif.style.background = type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : "#3b82f6";
  notif.style.color = "#fff";
  notif.style.padding = "12px 20px";
  notif.style.marginTop = "10px";
  notif.style.borderRadius = "8px";
  notif.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  notif.style.fontWeight = "500";
  notif.style.opacity = "0";
  notif.style.transition = "all 0.3s ease";
  container.appendChild(notif);

  requestAnimationFrame(() => {
    notif.style.opacity = "1";
    notif.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    notif.style.opacity = "0";
    notif.style.transform = "translateY(-20px)";
    setTimeout(() => container.removeChild(notif), 300);
  }, 3500);
}
