import styled from "styled-components";
import { auth } from "../firebase";

const Wrapper = styled.div`
    display: grid;
    gap: 50px;
    grid-template-columns: 1fr 4fr;
`;

export default function Home() {
  const logOut = () => {
    auth.signOut();
  };
  return (
    <Wrapper>
        <h1>🏠 월드 피드 (Home)</h1>
        <button onClick={logOut} style={{color:"black"}}>로그아웃</button>
    </Wrapper>
  );
}