import { useState } from "react";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Wrapper, Title, SubTitle, Form, Input, Error, Switcher } from "../components/auth-components";
import styled from "styled-components";

const Button = styled.button`
  margin-top: 20px;
  background-color: white;
  color: black;
  font-weight: 600;
  width: 100%;
  padding: 10px 20px;
  border-radius: 50px;
  border: 0;
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
`;

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") setEmail(value);
    else if (name === "password") setPassword(value);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (isLoading || email === "" || password === "") return;
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (e) {
      if (e instanceof FirebaseError) {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const onSocialClick = async (providerName) => {
    try {
        let provider;
        if(providerName === "google") {
            provider = new GoogleAuthProvider();
        }
        await signInWithPopup(auth, provider);
        navigate("/");
    } catch (error) {
        console.error(error);
        setError("소셜 로그인에 실패했습니다.");
    }
  }

  return (
    <Wrapper>
      <Title>mylog</Title>
      <SubTitle>오늘의 나를 기록하세요.</SubTitle>
      <Form onSubmit={onSubmit}>
        <Input onChange={onChange} name="email" value={email} placeholder="이메일" type="email" required />
        <Input onChange={onChange} name="password" value={password} placeholder="비밀번호" type="password" required />
        <Input type="submit" value={isLoading ? "로딩 중..." : "로그인"} />
      </Form>
      {error !== "" ? <Error>{error}</Error> : null}
      
      <Button onClick={() => onSocialClick("google")}>
         Google로 계속하기
      </Button>

      <Switcher>
        계정이 없으신가요? <Link to="/create-account">회원가입 &rarr;</Link>
      </Switcher>
    </Wrapper>
  );
}