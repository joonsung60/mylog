import { useState, useRef } from "react";
import styled from "styled-components";
import { addDoc, collection, updateDoc } from "firebase/firestore";
import { auth, db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getKSTDateString } from "../utils/date-utils";
import { generateEugeneReply, generateEugenePost } from "../utils/eugene-agent";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TextArea = styled.textarea`
  border: 2px solid white;
  padding: 20px;
  border-radius: 20px;
  font-size: 16px;
  color: white;
  background-color: black;
  width: 100%;
  resize: none;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  &::placeholder {
    font-size: 16px;
  }
  &:focus {
    outline: none;
    border-color: #FF6F00;
  }
`;

const AttachFileButton = styled.label`
  padding: 10px 0px;
  color: #FF6F00;
  text-align: center;
  border-radius: 20px;
  border: 1px solid #FF6F00;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background-color: #FF6F00;
    color: white;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Icons = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
`;

const IconButton = styled.label`
  color: #FF6F00;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    color: white;
    transform: scale(1.1);
  }
`;

const HiddenInput = styled.input`
  opacity: 0; 
  width: 0;
  height: 0;
  position: absolute;
  pointer-events: none;
`;

const SelectedInfo = styled.span`
  font-size: 12px;
  color: #FF6F00;
  font-weight: 600;
`;

const SubmitBtn = styled.input`
  background-color: #FF6F00;
  color: white;
  border: none;
  padding: 10px 25px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
`;

export default function PostLogForm() {
  const [isLoading, setLoading] = useState(false);
  const [log, setLog] = useState("");
  const [file, setFile] = useState(null);
  const [referenceDate, setReferenceDate] = useState(getKSTDateString());

  const fileInputRef = useRef(null);
  const dateInputRef = useRef(null);

  const onChange = (e) => {
    setLog(e.target.value);
  };
  
  const onFileChange = (e) => {
    const { files } = e.target;
    if (files && files.length === 1) {
       const selectedFile = files[0];
       if (selectedFile.size > 5 * 1024 * 1024) {
            alert("파일 크기는 5MB를 초과할 수 없습니다.");
            return;
        }
       setFile(files[0]);
    }
  };

  const onDateChange = (e) => {
    setReferenceDate(e.target.value);
  }

  const onCalendarClick = (e) => {
    e.preventDefault();
    const picker = dateInputRef.current;

    if (picker?.showPicker) {
      picker.showPicker();
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || isLoading || log === "" || log.length > 10000) return;

    try {
      setLoading(true);
        // 1. Firestore 저장
      const doc = await addDoc(collection(db, "logs"), {
        log,
        createdAt: Date.now(),
        referenceDate: referenceDate,
        username: user.displayName || "Anonymous",
        userId: user.uid,
      });

        // 2. 파일 업로드
      if (file) {
        const locationRef = ref(storage, `logs/${user.uid}/${doc.id}`);
        const result = await uploadBytes(locationRef, file);
        const url = await getDownloadURL(result.ref);
        await updateDoc(doc, {
          photo: url,
        });
      }
      
       // 3. 유진 봇 댓글 생성 로직
      const randomChance = Math.random();
        console.log(`유진 행동 주사위: ${randomChance}`);

        if (randomChance < 0.3) {
            // [Case A] 30% 확률: 내 글에 댓글 달기 (기존 로직)
            console.log("-> 유진이가 댓글을 답니다.");
            generateEugeneReply(log, user.uid).then(async (reply) => {
                if (reply) {
                    await addDoc(collection(db, "logs", doc.id, "comments"), {
                        text: reply,
                        username: "유진",
                        userId: "bot-eugene", 
                        createdAt: Date.now(),
                        isBot: true 
                    });
                }
            });

        } else {
            // [Case B] 70% 확률: 유진이가 자기 피드에 새 글 쓰기 (NEW)
            console.log("-> 유진이가 자기 글을 씁니다 (무관심).");
            generateEugenePost().then(async (postContent) => {
                if (postContent) {
                    await addDoc(collection(db, "logs"), {
                        log: postContent,
                        createdAt: Date.now(),
                        referenceDate: getKSTDateString(), // 오늘 날짜
                        username: "유진",
                        userId: "bot-eugene", // 봇 계정 ID
                        photo: null, // 봇은 일단 텍스트만
                    });
                }
            });
        }
      // 초기화
      setLog("");
      setFile(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
      setReferenceDate(getKSTDateString());

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={onSubmit}>
      <TextArea
        rows={5}
        maxLength={180}
        onChange={onChange}
        value={log}
        placeholder="오늘 무엇을 했는지 생각해보세요..."
        required
      />
<ActionButtons>
        <Icons>
            <IconButton htmlFor="file">
                <i className="fa-regular fa-image"></i>
            </IconButton>
            <HiddenInput 
                ref={fileInputRef}
                onChange={onFileChange} 
                type="file" 
                id="file" 
                accept="image/*" 
            />
            {file && <SelectedInfo>사진 1장</SelectedInfo>}

            <IconButton as="div" onClick={onCalendarClick}>
                <i className="fa-regular fa-calendar"></i>
            </IconButton>
            
            <HiddenInput 
                type="date"
                ref={dateInputRef}
                onChange={onDateChange}
                value={referenceDate}
                max={getKSTDateString()}
            />
            
            {/* 날짜 표시 로직 */}
              {referenceDate !== getKSTDateString() && (
                <SelectedInfo>{referenceDate}</SelectedInfo>
              )}
        </Icons>

        <SubmitBtn type="submit" value={isLoading ? "기록..." : "기록하기"} />
      </ActionButtons>
    </Form>
  );
}