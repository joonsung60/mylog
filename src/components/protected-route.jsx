import { Navigate } from "react-router-dom";
import { auth } from "../firebase";

export default function ProtectedRoute({ children }) {
  // 로그인 안 했으면 로그인 페이지로 쫓아냄
  const user = auth.currentUser;
  if (user === null) {
    return <Navigate to="/login" />;
  }
  // 로그인 했으면 자식 컴포넌트(Home) 보여줌
  return children;
}