import { useState, useRef } from "react";
import styled from "styled-components";
import { addDoc, collection, updateDoc } from "firebase/firestore";
import { auth, db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getKSTDateString } from "../utils/date-utils";
import { handleUserPost } from "../bots/bot-manager"; // ← 새로운 import

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
    if (!user || isLoading || log === "" || log.length > 500) return;

    try {
      setLoading(true);
      
      // 1. 사용자 글 저장
      const doc = await addDoc(collection(db, "logs"), {
        log,
        createdAt: Date.now(),
        referenceDate: referenceDate,
        username: user.displayName || "Anonymous",
        userId: user.uid,
        isBot: false, // ← 명시적으로 false
      });

      // 2. 사진 업로드 (있으면)
      if (file) {
        const locationRef = ref(storage, `logs/${user.uid}/${doc.id}`);
        const result = await uploadBytes(locationRef, file);
        const url = await getDownloadURL(result.ref);
        await updateDoc(doc, {
          photo: url,
        });
      }
      
      // 3. 봇 행동 실행 (리팩토링된 함수 사용!)
      await handleUserPost(log, doc.id, user.uid, referenceDate);
      
      // 4. 폼 초기화
      setLog("");
      setFile(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
      setReferenceDate(getKSTDateString());

    } catch (e) {
      console.error(e);
      alert("글 작성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={onSubmit}>
      <TextArea
        rows={5}
        maxLength={500}
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
            
              {referenceDate !== getKSTDateString() && (
                <SelectedInfo>{referenceDate}</SelectedInfo>
              )}
        </Icons>

        <SubmitBtn type="submit" value={isLoading ? "기록..." : "기록하기"} />
      </ActionButtons>
    </Form>
  );
}