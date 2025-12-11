import { Outlet, Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { auth } from "../firebase";

const Container = styled.div`
  display: grid;
  grid-template-columns: 275px 1fr 350px; // 왼쪽 | 중앙 | 오른쪽 비율 고정
  gap: 30px;
  width: 100%;
  max-width: 1200px;
  min-height: 100vh;
  padding: 0 20px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 80px 1fr; // 화면 작아지면 오른쪽 위젯 숨김
    & > :last-child { display: none; }
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

const LogOutBtn = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px;
  margin-top: auto; // 바닥에 붙이기
  color: tomato;
  font-weight: bold;
`;

const RightSidebar = styled.div`
  padding: 20px 0;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  height: 100vh;
  position: sticky;
  top: 0;
`;

const SearchBar = styled.input`
  width: 100%;
  padding: 15px;
  border-radius: 30px;
  border: none;
  background-color: #202327;
  color: white;
  margin-bottom: 20px;
  font-size: 15px;
  &:focus {
    outline: 2px solid #FF6F00;
  }
`;

const WidgetBox = styled.div`
  background-color: #16181C;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  h2 {
    font-weight: 800;
    font-size: 20px;
    margin-bottom: 15px;
  }
  p {
    color: #71767B;
    font-size: 14px;
    line-height: 1.4;
  }
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

  return (
    <Container>
      {/* 1. 왼쪽 사이드바 */}
      <LeftSidebar>
        <Logo>mylog</Logo>
        <MenuItem to="/">
            <i className="fa-solid fa-house"></i> 홈
        </MenuItem>
        <MenuItem to="/profile">
            <i className="fa-solid fa-user"></i> 프로필
        </MenuItem>
        <LogOutBtn onClick={onLogOut}>
             <i className="fa-solid fa-right-from-bracket"></i> 로그아웃
        </LogOutBtn>
      </LeftSidebar>

      {/* 2. 중앙 컨텐츠 (여기에 Home, Profile 등이 들어옴) */}
      <Outlet />

      {/* 3. 오른쪽 사이드바 */}
      <RightSidebar>
        <SearchBar placeholder="기록 검색..." />
        
        <WidgetBox>
            <div style={{display:'flex', gap:'10px', marginTop:'15px', alignItems:'center'}}>
            <div style={{width:'40px', height:'40px', background:'green', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}>💪</div>
            <div>
                <div style={{fontWeight:'bold', marginBottom: '4px'}}>치어리더 봇</div>
                <div style={{fontSize:'12px', color:'green'}}>● 온라인</div>
            </div>
            </div>
            <div style={{display:'flex', gap:'10px', marginTop:'15px', alignItems:'center'}}>
                 <div style={{width:'40px', height:'40px', background:'white', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}>👤</div>
                 <div>
                    <div style={{fontWeight:'bold', marginBottom: '4px'}}>유진</div>
                    <div style={{fontSize:'12px', color:'gray'}}>대기 중...</div>
                </div>
            </div>
        </WidgetBox>

        <WidgetBox>
            <h2>Action Defines Identity.</h2>
            <p>
                나의 기록이 나를 이끕니다.<br/>
                오늘도 당신의 여정을 기록해보세요.
            </p>
        </WidgetBox>
      </RightSidebar>
    </Container>
  );
}