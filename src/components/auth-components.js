import styled from "styled-components";

export const Wrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 420px;
  padding: 50px 0px;
`;

export const Title = styled.h1`
  font-size: 42px;
  font-weight: 900;
  color: #FF6F00; /* Sunset Orange */
  margin-bottom: 20px;
`;

export const SubTitle = styled.h2`
  font-size: 18px;
  color: #8b9dc3;
  margin-bottom: 40px;
`;

export const Form = styled.form`
  margin-top: 10px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

export const Input = styled.input`
  padding: 10px 20px;
  border-radius: 50px;
  border: none;
  width: 100%;
  font-size: 16px;
  background-color: #1a1a40;
  color: white;
  &::placeholder {
    color: #6c757d;
  }
  &:focus {
    outline: 2px solid #FF6F00;
  }
  &[type="submit"] {
    cursor: pointer;
    background-color: #FF6F00;
    color: white;
    font-weight: bold;
    transition: opacity 0.2s;
    &:hover {
      opacity: 0.8;
    }
  }
`;

export const Error = styled.span`
  font-weight: 600;
  color: tomato;
`;

export const Switcher = styled.span`
  margin-top: 20px;
  a {
    color: #FF6F00;
    margin-left: 10px;
    text-decoration: none;
    font-weight: 600;
  }
`;