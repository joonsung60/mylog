import styled from "styled-components";
import { auth, db, storage } from "../firebase";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { getKSTDateString, getKSTTimeString } from "../utils/date-utils";
import { generateEugeneReply } from "../utils/eugene-agent";
import { Link } from "react-router-dom";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 15px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #FF6F00;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 14px;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Username = styled.span`
  font-weight: 600;
  font-size: 15px;
`;

const DateInfo = styled.span`
  font-size: 12px;
  color: #8b9dc3;
`;

const Payload = styled.p`
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 15px;
  white-space: pre-wrap;
`;

const Photo = styled.img`
  width: 100%;
  max-height: 400px;
  border-radius: 10px;
  object-fit: cover;
  margin-top: 10px;
  border: 1px solid rgba(255,255,255,0.1);
`;

const ActionBtnGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
  justify-content: flex-end;
`;

const ActionBtn = styled.button`
  background-color: transparent;
  color: gray;
  border: 1px solid gray;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    color: ${(props) => props.$color || "white"};
    border-color: ${(props) => props.$color || "white"};
  }
`;

const EditTextArea = styled.textarea`
  width: 100%;
  background-color: #1a1a1a;
  color: white;
  border: 1px solid #FF6F00;
  border-radius: 10px;
  padding: 10px;
  font-size: 16px;
  resize: none;
  margin-bottom: 10px;
  font-family: inherit;
`;

const CommentSection = styled.div`
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
`;

const CommentItem = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
  align-items: flex-start;
`;

const CommentForm = styled.form`
  display: flex;
  gap: 10px;
`;

const CommentInput = styled.input`
  flex: 1;
  background-color: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 10px;
  border-radius: 20px;
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: #FF6F00;
  }
`;

const CommentBtn = styled.button`
background-color: transparent;
  color: gray;
  border: 1px solid gray;
  padding: 5px 15px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  
  &:hover {
    color: #FF6F00;
    border-color: #FF6F00;
  }
`;

const CommentAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #555;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  color: white;
  flex-shrink: 0;
  overflow: hidden;
`;

const CommentContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CommentMeta = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const CommentUsername = styled.span`
  font-weight: 700;
  font-size: 13px;
  color: #eff3f4;
  margin-right: 8px;
`;

const CommentTime = styled.span`
  font-size: 11px;
  color: #71767b;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  gap: 10px;
`;

export default function Log({ username, photo, log, userId, id, referenceDate, createdAt, isBot }) {
  const user = auth.currentUser;
  const profileLink = isBot ? "/profile/bot-eugene" : `/profile/${userId}`;

  const [isEditing, setIsEditing] = useState(false);
  const [editedLog, setEditedLog] = useState(log);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  
  useEffect(() => {
    const q = query(
        collection(db, "logs", id, "comments"),
        orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setComments(commentsData);
    });
    return () => unsubscribe();
  }, [id]);

    const onSubmitComment = async (e) => {
      e.preventDefault();
      if(commentText === "") return;
      
      try {
          await addDoc(collection(db, "logs", id, "comments"), {
            text: commentText,
            username: user.displayName || "익명",
            userId: user.uid,
            createdAt: Date.now(),
            isBot: false
          });
          
          const userComment = commentText;
          setCommentText("");

          const randomChance = Math.random();
          console.log(`유진 대댓글 확률: ${randomChance}`);

          if (randomChance < 1) {
              const contextForEugene = `
                [Original Log]: "${log}"
                [User's Reply]: "${userComment}"
              `;

              generateEugeneReply(contextForEugene, user.uid).then(async (reply) => {
                  if (reply) {
                      await addDoc(collection(db, "logs", id, "comments"), {
                          text: reply,
                          username: "유진",
                          userId: "bot-eugene",
                          createdAt: Date.now(),
                          isBot: true
                      });
                  }
              });
          }

      } catch (e) {
          console.error(e);
          alert("댓글 작성 실패");
      }
    };

  const onDelete = async () => {
    const ok = confirm("이 기록을 정말 삭제하시겠습니까?");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "logs", id));
      if (photo) {
        const photoRef = ref(storage, photo);
        await deleteObject(photoRef);
      }
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const onEdit = () => {
    setIsEditing((prev) => !prev);
    setEditedLog(log);
  };

  const onSave = async () => {
    if(editedLog === "" || editedLog.length > 180) return;
    try {
      await updateDoc(doc(db, "logs", id), {
        log: editedLog
      });
      setIsEditing(false);
    } catch(e) {
      console.error(e);
    }
  }

  const createdString = getKSTDateString(createdAt);

  const targetDate = referenceDate || createdString;

  const dateDisplay = (targetDate === createdString) 
    ? `${createdString}의 기록` 
    : `${createdString}의 기록 (${targetDate})`;

  return (
    <Wrapper>
      <Header>
        <StyledLink to={profileLink}>
            <Avatar>{username.slice(0, 1).toUpperCase()}</Avatar>
            <UserInfo>
                <Username>{username}</Username>
                <DateInfo>
                    <i className="fa-regular fa-calendar-check"></i>
                    {dateDisplay}
                </DateInfo>
            </UserInfo>
        </StyledLink>
      </Header>

      {isEditing ? (
        <>
            <EditTextArea 
                rows={3} 
                value={editedLog} 
                onChange={(e) => setEditedLog(e.target.value)} 
            />
            <ActionBtnGroup>
                <ActionBtn onClick={onEdit}>취소</ActionBtn>
                <ActionBtn $color="#FF6F00" onClick={onSave}>저장</ActionBtn>
            </ActionBtnGroup>
        </>
      ) : (
        <>
            <Payload>{log}</Payload>
            {photo ? <Photo src={photo} /> : null}
            
            {user?.uid === userId && !isBot ? (
                <ActionBtnGroup>
                    <ActionBtn $color="#4aa8d8" onClick={onEdit}>수정</ActionBtn>
                    <ActionBtn $color="tomato" onClick={onDelete}>삭제</ActionBtn>
                </ActionBtnGroup>
            ) : null}
        </>
      )}

        <CommentSection>
          <CommentList>
              {comments.map((comment) => (
                  <CommentItem key={comment.id}>
                      <Link 
                        to={comment.isBot ? "/profile/bot-eugene" : `/profile/${comment.userId}`} 
                        style={{textDecoration:'none', color:'inherit'}}
                      >
                        <CommentAvatar>
                            {comment.isBot ? <i className="fa-solid fa-user"></i> : comment.username.slice(0,1)}
                        </CommentAvatar>
                      </Link>
                      
                      <CommentContent>
                          <CommentMeta>
                              <Link 
                                to={comment.isBot ? "/profile/bot-eugene" : `/profile/${comment.userId}`}
                                style={{textDecoration:'none', color:'inherit'}}
                              >
                                  <CommentUsername>
                                      {comment.username}
                                  </CommentUsername>
                              </Link>
                              <CommentTime>{getKSTTimeString(comment.createdAt)}</CommentTime>
                          </CommentMeta>
                          
                          <div style={{fontSize: '14px', lineHeight:'1.4'}}>
                              {comment.text}
                          </div>
                      </CommentContent>
                  </CommentItem>
              ))}
          </CommentList>
          
          <CommentForm onSubmit={onSubmitComment}>
              <CommentInput 
                  placeholder="..." 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
              />
              <CommentBtn type="submit">등록</CommentBtn>
          </CommentForm>
      </CommentSection>
    </Wrapper>
  );
}