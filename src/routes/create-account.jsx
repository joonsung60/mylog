import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { Link, useNavigate } from "react-router-dom";
import {
  Wrapper,
  Title,
  SubTitle,
  Form,
  Input,
  Error,
  Switcher,
} from "../components/auth-components";

export default function CreateAccount() {
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onChange = (e) => {
    const {
      target: { name, value },
    } = e;
    if (name === "name") {
      setName(value);
    } else if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (isLoading || name === "" || email === "" || password === "") return;
    
    if (password.length < 6) {
        setError("비밀번호는 최소 6자 이상이어야 합니다.");
        return;
    }

    try {
      setLoading(true);
      
      const credentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      await updateProfile(credentials.user, {
        displayName: name,
      });
      await setDoc(doc(db, "users", credentials.user.uid), {
          displayName: name,
          email: email,
          bio: "",
          photoURL: null,
          createdAt: Date.now(),
          userId: credentials.user.uid,
      });

      navigate("/");
    } catch (e) {
      if (e instanceof FirebaseError) {
        if(e.code === "auth/email-already-in-use") {
            setError("이미 사용 중인 이메일입니다.");
        } else if (e.code === "auth/weak-password") {
            setError("비밀번호가 너무 약합니다.");
        } else {
            setError(e.message);
        }
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <Title>가입하기</Title>
      <SubTitle>오늘의 나를 기록해보세요!</SubTitle>
      <Form onSubmit={onSubmit}>
        <Input
          onChange={onChange}
          name="name"
          value={name}
          placeholder="이름"
          type="text"
          required
        />
        <Input
          onChange={onChange}
          name="email"
          value={email}
          placeholder="이메일"
          type="email"
          required
        />
        <Input
          onChange={onChange}
          name="password"
          value={password}
          placeholder="비밀번호"
          type="password"
          required
        />
        <Input
          type="submit"
          value={isLoading ? "가입 중..." : "회원가입"}
        />
      </Form>
      {error !== "" ? <Error>{error}</Error> : null}
      <Switcher>
        이미 계정이 있으신가요?{" "}
        <Link to="/login">로그인 &rarr;</Link>
      </Switcher>
    </Wrapper>
  );
}