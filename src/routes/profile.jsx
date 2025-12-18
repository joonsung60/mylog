import { collection, getDocs, orderBy, query, where, doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { auth, db, storage } from "../firebase";
import Log from "../components/log";
import { BOT_PROFILES } from "../utils/bot-profiles";
import PostLogForm from "../components/post-log-form";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 0;
  height: 100%;
  overflow-y: auto;
  width: 100%; 
  margin: 0 auto;

  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;

const ProfileHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
  padding: 0 10px 30px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const AvatarLabel = styled.label`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: ${props => props.$isBot ? "#FF6F00" : "#555"};
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  color: white;
  overflow: hidden;
  cursor: ${props => props.$isEditing ? "pointer" : "default"};
  border: ${props => props.$isEditing ? "2px solid #FF6F00" : "none"};
  position: relative;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  &:hover::after {
    content: ${props => props.$isEditing ? '"📷"' : '""'};
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
  }
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 10px;
`;

const NameRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const Name = styled.span`
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
`;

const Bio = styled.p`
  color: #ccc;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  margin: 0;
`;

const NameInput = styled.input`
  background-color: #202327;
  color: white;
  border: 1px solid gray;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 18px;
  width: 100%;
  max-width: 200px;
  &:focus { border-color: #FF6F00; outline: none; }
`;

const BioInput = styled.textarea`
  background-color: #202327;
  color: white;
  border: 1px solid gray;
  padding: 10px;
  border-radius: 10px;
  font-size: 14px;
  width: 100%;
  resize: none;
  font-family: inherit;
  &:focus { border-color: #FF6F00; outline: none; }
`;

const ButtonsColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
`;

const EditBtn = styled.button`
  background-color: transparent;
  color: gray;
  border: 1px solid gray;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  &:hover { 
    border-color: white;
    color: white;
  }
`;

const LogoutBtn = styled(EditBtn)`
  color: tomato;
  border-color: tomato;
  
  &:hover {
    background-color: tomato;
    color: white;
    border-color: tomato;
  }
`;

const SaveBtn = styled(EditBtn)`
  color: #FF6F00;
  border-color: #FF6F00;
  &:hover { 
    background-color: #FF6F00; 
    color: white; 
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 15px;
  width: 100%;
  justify-content: center;
  margin-bottom: 20px;
`;

const FilterBtn = styled.button`
  flex: 1;
  max-width: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;

  background-color: ${props => props.$active ? "#FF6F00" : "#202327"};
  color: ${props => props.$active ? "#ffffff" : "#888"};
  border: 1px solid ${props => props.$active ? "#FF6F00" : "#555"};
  
  padding: 12px 0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    filter: brightness(1.2);
    border-color: #FF6F00;
  }
`;

export default function Profile() {
  const { userId } = useParams();
  const [logs, setLogs] = useState([]);
  
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [bio, setBio] = useState("");
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);

  const [filterType, setFilterType] = useState("created"); 
  const [order, setOrder] = useState("desc"); 

  const isMyProfile = userId === auth.currentUser?.uid;
  const botProfile = BOT_PROFILES[userId];
  const isBot = !!botProfile;
  const user = auth.currentUser;

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      if (botProfile) {
        setName(botProfile.name);
        setBio(botProfile.bio);
        setAvatar(botProfile.avatar);
      } 
      else {
        const authUser = auth.currentUser;
        let tempName = "알 수 없는 사용자";
        let tempBio = "Action Defines Identity.";
        let tempAvatar = null;

        if(userId === authUser?.uid) {
            tempName = authUser.displayName;
            tempAvatar = authUser.photoURL;
        }

        try {
            const userDocRef = doc(db, "users", userId);
            const userDoc = await getDoc(userDocRef);
            if(userDoc.exists()) {
                const data = userDoc.data();
                if(data.bio) tempBio = data.bio;
                if(data.displayName) tempName = data.displayName;
                if(data.photoURL) tempAvatar = data.photoURL;
            }
        } catch(e) {
            console.error(e);
        }

        setName(tempName);
        setBio(tempBio);
        setAvatar(tempAvatar);
        
        setEditName(tempName);
        setEditBio(tempBio);
        setEditAvatarPreview(tempAvatar);
      }

      const logsRef = collection(db, "logs");
      const targetUid = isBot ? user.uid : userId;

      const q = query(
        logsRef,
        where("userId", "==", targetUid),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(q);
      
      const filteredLogs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
        .filter(log => {
            if (isBot) {
                return log.isBot === true;
            } else {
                return !log.isBot;
            }
        });

      setLogs(filteredLogs);
    };

    fetchProfile();
  }, [userId, isBot, user]);

  const onSave = async () => {
    if(!isMyProfile) return;
    try {
        const user = auth.currentUser;
        let photoURL = avatar;

        if(editAvatarFile) {
            const locationRef = ref(storage, `avatars/${user.uid}`);
            const result = await uploadBytes(locationRef, editAvatarFile);
            photoURL = await getDownloadURL(result.ref);
        }

        await updateProfile(user, { displayName: editName, photoURL: photoURL });

        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
            displayName: editName,
            photoURL: photoURL,
            bio: editBio,
            updatedAt: Date.now()
        }, { merge: true });

        setName(editName);
        setBio(editBio);
        setAvatar(photoURL);
        setIsEditing(false);
        setEditAvatarFile(null);
    } catch(e) {
        console.error(e);
        alert("프로필 업데이트 실패");
    }
  };

  const onAvatarChange = (e) => {
    const {files} = e.target;
    if(files && files.length === 1) {
        setEditAvatarFile(files[0]);
        setEditAvatarPreview(URL.createObjectURL(files[0]));
    }
  };

  const onFilterClick = (type) => {
    if (filterType === type) {
        setOrder(prev => prev === "desc" ? "asc" : "desc");
    } else {
        setFilterType(type);
        setOrder("desc");
    }
  };

  const onLogOut = async () => {
    const ok = confirm("정말 로그아웃 하시겠습니까?");
    if (ok) {
      await signOut(auth);
      navigate("/login");
    }
  };

  const getSortedLogs = () => {
    const sorted = [...logs];
    
    if (filterType === "created") {
        return sorted.sort((a, b) => {
            return order === "desc" 
                ? b.createdAt - a.createdAt 
                : a.createdAt - b.createdAt;
        });
    } 
    else if (filterType === "reference") {
        return sorted.sort((a, b) => {
            return order === "desc" 
                ? b.referenceDate.localeCompare(a.referenceDate)
                : a.referenceDate.localeCompare(b.referenceDate);
        });
    }
    return sorted;
  };

  return (
    <Wrapper>
      <ProfileHeader>
        <AvatarLabel htmlFor="avatar" $isBot={isBot} $isEditing={isEditing}>
            {isEditing && isMyProfile ? (
                <img src={editAvatarPreview || "https://via.placeholder.com/80"} />
            ) : (
                avatar ? <img src={avatar} /> : <i className="fa-solid fa-user"></i>
            )}
        </AvatarLabel>
        
        {isEditing && (
            <HiddenInput id="avatar" type="file" accept="image/*" onChange={onAvatarChange}/>
        )}

        <ProfileInfo>
            <NameRow>
                {isEditing ? (
                    <NameInput value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="이름" />
                ) : (
                    <Name>{name}</Name>
                )}

                {isMyProfile && !botProfile && (
                    <ButtonsColumn>
                        {isEditing ? (
                            <div style={{display:'flex', gap:'5px'}}>
                                <EditBtn onClick={() => setIsEditing(false)}>취소</EditBtn>
                                <SaveBtn onClick={onSave}>저장</SaveBtn>
                            </div>
                        ) : (
                            <>
                                <EditBtn onClick={() => setIsEditing(true)}>프로필 수정</EditBtn>
                                <LogoutBtn onClick={onLogOut}>로그아웃</LogoutBtn>
                            </>
                        )}
                    </ButtonsColumn>
                )}
            </NameRow>

            {isEditing ? (
                <BioInput value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={2} placeholder="자기소개" />
            ) : (
                <Bio>{bio}</Bio>
            )}
        </ProfileInfo>
      </ProfileHeader>

      {isMyProfile && (
        <div style={{width: '100%', marginBottom: '20px'}}>
            <PostLogForm />
        </div>
      )}

      <FilterContainer>
        <FilterBtn 
            $active={filterType === "created"} 
            onClick={() => onFilterClick("created")}
        >
            작성 일자 {filterType === "created" && (order === "desc" ? "▼" : "▲")}
        </FilterBtn>
        
        <FilterBtn 
            $active={filterType === "reference"} 
            onClick={() => onFilterClick("reference")}
        >
            기준 일자 {filterType === "reference" && (order === "desc" ? "▼" : "▲")}
        </FilterBtn>
      </FilterContainer>

      {getSortedLogs().map((log) => (
        <Log key={log.id} {...log} />
      ))}
    </Wrapper>
  );
}