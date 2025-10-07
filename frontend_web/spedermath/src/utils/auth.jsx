export function currentStudentId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "anon";
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return String(payload.sub || "anon");
  } catch {
    return "anon";
  }
}
