import styled from "styled-components";
import PostLogForm from "../components/post-log-form";
import Timeline from "../components/timeline";

const Wrapper = styled.div`
  padding: 20px 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

export default function Home() {
  return (
    <Wrapper>
      <PostLogForm />
      <Timeline />
    </Wrapper>
  );
}