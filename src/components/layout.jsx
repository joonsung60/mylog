import { Outlet, Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { auth } from "../firebase";

const Container = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: 275px 1fr;
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    padding: 0 10px; // 좌우 여백 살짝
    gap: 0;
  }
`;

const LeftSidebar = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  height: 100vh;
  position: sticky;
  top: 0;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const Logo = styled.h1`
  font-size: 32px;
  font-weight: 900;
  color: #FF6F00;
  margin-bottom: 30px;
  letter-spacing: -1px;
`;

const MenuItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px;
  text-decoration: none;
  color: white;
  font-size: 20px;
  font-weight: 600;
  border-radius: 30px;
  transition: background 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  i {
    width: 30px;
    text-align: center;
  }
`;

const MobileNavigation = styled.div`
  display: none;
  
  @media (max-width: 1024px) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 5px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    margin-bottom: 20px;
    position: sticky;
    top: 0;
    background-color: black;
    z-index: 99;
  }
`;

const MobileLogo = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: #FF6F00;
`;

const MobileMenu = styled.div`
  display: flex;
  gap: 20px;
  font-size: 18px;
  align-items: center;
  
  a {
    text-decoration: none;
    color: white;
    display: flex;
    align-items: center;
  }
`;

const LogOutBtn = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px;
  margin-top: auto;
  color: tomato;
  font-weight: bold;
`;

export default function Layout() {
  const navigate = useNavigate();
  const onLogOut = async () => {
    const ok = confirm("로그아웃 하시겠습니까?");
    if (ok) {
      await auth.signOut();
      navigate("/login");
    }
  };
  const user = auth.currentUser;

  return (
    <Container>
      <MobileNavigation>
         <Link to="/">
            <MobileLogo>mylog</MobileLogo>
         </Link>
         <MobileMenu>
            <Link to={`/profile/${auth.currentUser?.uid}`}>
                <i className="fa-solid fa-user"></i>
            </Link>
         </MobileMenu>
      </MobileNavigation>
      <LeftSidebar>
        <Logo>mylog</Logo>
        <MenuItem to="/">
            <i className="fa-solid fa-house"></i> 홈
        </MenuItem>
        <MenuItem to={`/profile/${user?.uid}`}> 
            <i className="fa-solid fa-user"></i> 내 프로필
        </MenuItem>
        <LogOutBtn onClick={onLogOut}>
             <i className="fa-solid fa-right-from-bracket"></i> 로그아웃
        </LogOutBtn>
      </LeftSidebar>

      <Outlet />

    </Container>
  );
}